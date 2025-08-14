import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { KoreanInput } from "@/components/ui/korean-input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Trash2, Plus, Upload, ChevronDown, ChevronRight, Settings } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { supabase } from "@/integrations/supabase/client"

interface StudentInput {
  id: string
  name: string
  image: File | null
  imageUrl?: string
  student_id?: string
  student_number?: number
}

interface ClassroomManagementProps {
  teacherName: string
  school: string
  setSchool: (school: string) => void
  grade: string
  setGrade: (grade: string) => void
  classNumber: string
  setClassNumber: (classNumber: string) => void
  studentInputs: StudentInput[]
  setStudentInputs: (inputs: StudentInput[]) => void
  classroomId: string
  hasExistingClassroom: boolean
  loadClassroomData: (teacherName: string) => Promise<void>
}

export const ClassroomManagement = ({
  teacherName,
  school,
  setSchool,
  grade,
  setGrade,
  classNumber,
  setClassNumber,
  studentInputs,
  setStudentInputs,
  classroomId,
  hasExistingClassroom,
  loadClassroomData
}: ClassroomManagementProps) => {
  const [isOpen, setIsOpen] = useState(!hasExistingClassroom) // 기존 클래스룸이 없으면 열려있음

  const addStudentInput = () => {
    // 현재 학생들 중 가장 높은 번호 찾기
    const maxNumber = studentInputs.reduce((max, student) => {
      return Math.max(max, student.student_number || 0)
    }, 0)
    
    const newStudentInput: StudentInput = {
      id: Date.now().toString(),
      name: "",
      image: null,
      student_number: maxNumber + 1
    }
    setStudentInputs([...studentInputs, newStudentInput])
  }

  const removeStudentInput = (id: string) => {
    setStudentInputs(studentInputs.filter(input => input.id !== id))
  }

  const handleDeleteStudent = async (studentInput: StudentInput) => {
    if (!studentInput.student_id) {
      // 아직 저장되지 않은 학생은 UI에서만 제거
      removeStudentInput(studentInput.id)
      return
    }

    try {
      // 데이터베이스에서 학생 삭제 (관련 설문 응답들은 CASCADE로 자동 삭제됨)
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentInput.student_id)

      if (error) {
        console.error('Error deleting student:', error)
        alert('학생 삭제 중 오류가 발생했습니다.')
        return
      }

      // 성공 시 데이터 새로고침
      await loadClassroomData(teacherName)
      alert('학생이 삭제되었습니다. 관련된 모든 설문 응답도 함께 삭제되었습니다.')

    } catch (error) {
      console.error('Error deleting student:', error)
      alert('학생 삭제 중 오류가 발생했습니다.')
    }
  }

  const updateStudentName = (id: string, name: string) => {
    setStudentInputs(studentInputs.map(input => 
      input.id === id ? { ...input, name } : input
    ))
  }

  const updateStudentNumber = (id: string, number: number) => {
    setStudentInputs(studentInputs.map(input => 
      input.id === id ? { ...input, student_number: number } : input
    ))
  }

  const updateStudentImage = async (id: string, file: File | null) => {
    if (file) {
      try {
        // 파일 이름을 고유하게 만들기
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        
        // Supabase Storage에 업로드
        const { data, error } = await supabase.storage
          .from('images')
          .upload(fileName, file)

        if (error) {
          console.error('Error uploading image:', error)
          alert('이미지 업로드 중 오류가 발생했습니다.')
          return
        }

        // 업로드된 이미지의 public URL 생성
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(fileName)

        // studentInputs 상태 업데이트 (URL과 파일 모두 저장)
        setStudentInputs(studentInputs.map(input => 
          input.id === id ? { ...input, image: file, imageUrl: publicUrl } : input
        ))
      } catch (error) {
        console.error('Error handling image upload:', error)
        alert('이미지 처리 중 오류가 발생했습니다.')
      }
    } else {
      setStudentInputs(studentInputs.map(input => 
        input.id === id ? { ...input, image: null, imageUrl: undefined } : input
      ))
    }
  }

  const handleSaveClassroom = async () => {
    if (!school || !grade || !classNumber) {
      alert("모든 정보를 입력해주세요.")
      return
    }

    try {
      // 1. classrooms 테이블에 학급 정보 저장
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .insert({
          teacher_name: teacherName,
          school_name: school,
          grade: parseInt(grade),
          class_number: parseInt(classNumber),
          user_id: user?.id
        })
        .select()
        .single()

      if (classroomError) {
        console.error('Error creating classroom:', classroomError)
        alert("학급 정보 저장 중 오류가 발생했습니다.")
        return
      }

      // 2. students 테이블에 학생 정보 저장
      if (studentInputs.length > 0) {
        const studentsData = studentInputs
          .filter(student => student.name.trim()) // 이름이 있는 학생만
          .map(student => ({
            name: student.name.trim(),
            classroom_id: classroom.id,
            photo_url: student.imageUrl || null, // 업로드된 이미지 URL
            student_number: student.student_number || null
          }))

        if (studentsData.length > 0) {
          const { error: studentsError } = await supabase
            .from('students')
            .insert(studentsData)

          if (studentsError) {
            console.error('Error creating students:', studentsError)
            alert("학생 정보 저장 중 오류가 발생했습니다.")
            return
          }
        }
      }

      // 3. 성공 시 데이터 새로고침
      await loadClassroomData(teacherName)
      alert("학급 정보가 저장되었습니다.")

    } catch (error) {
      console.error('Error saving classroom:', error)
      alert("저장 중 오류가 발생했습니다.")
    }
  }

  const handleUpdateClassroom = async () => {
    if (!school || !grade || !classNumber) {
      alert("모든 정보를 입력해주세요.")
      return
    }

    try {
      // 1. 학급 정보 업데이트 (변경된 것만)
      const { data: currentClassroom, error: fetchError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', classroomId)
        .single()

      if (fetchError) {
        console.error('Error fetching current classroom:', fetchError)
        alert("현재 학급 정보를 불러오는 중 오류가 발생했습니다.")
        return
      }

      // 학급 정보 변경 사항 확인 및 업데이트
      const classroomUpdates: any = {}
      if (currentClassroom.school_name !== school) classroomUpdates.school_name = school
      if (currentClassroom.grade !== parseInt(grade)) classroomUpdates.grade = parseInt(grade)
      if (currentClassroom.class_number !== parseInt(classNumber)) classroomUpdates.class_number = parseInt(classNumber)

      if (Object.keys(classroomUpdates).length > 0) {
        const { error: classroomUpdateError } = await supabase
          .from('classrooms')
          .update(classroomUpdates)
          .eq('id', classroomId)

        if (classroomUpdateError) {
          console.error('Error updating classroom:', classroomUpdateError)
          alert("학급 정보 수정 중 오류가 발생했습니다.")
          return
        }
      }

      // 2. 현재 학생 데이터 가져오기
      const { data: currentStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('classroom_id', classroomId)

      if (studentsError) {
        console.error('Error fetching current students:', studentsError)
        alert("현재 학생 정보를 불러오는 중 오류가 발생했습니다.")
        return
      }

      // 3. 학생 데이터 변경사항 처리
      const currentStudentIds = new Set(currentStudents?.map(s => s.id) || [])
      const formStudentIds = new Set(
        studentInputs
          .filter(input => input.student_id)
          .map(input => input.student_id)
      )

      // 삭제된 학생들
      const studentsToDelete = currentStudents?.filter(s => !formStudentIds.has(s.id)) || []
      
      // 새로 추가된 학생들
      const studentsToAdd = studentInputs.filter(input => 
        !input.student_id && input.name.trim()
      )

      // 수정된 학생들
      const studentsToUpdate = studentInputs.filter(input => {
        if (!input.student_id || !input.name.trim()) return false
        
        const currentStudent = currentStudents?.find(s => s.id === input.student_id)
        if (!currentStudent) return false
        
        return (
          currentStudent.name !== input.name.trim() ||
          currentStudent.photo_url !== (input.imageUrl || null) ||
          currentStudent.student_number !== (input.student_number || null)
        )
      })

      // 4. 삭제 처리
      if (studentsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('students')
          .delete()
          .in('id', studentsToDelete.map(s => s.id))

        if (deleteError) {
          console.error('Error deleting students:', deleteError)
          alert("학생 삭제 중 오류가 발생했습니다.")
          return
        }
      }

      // 5. 추가 처리
      if (studentsToAdd.length > 0) {
        const newStudentsData = studentsToAdd.map(student => ({
          name: student.name.trim(),
          classroom_id: classroomId,
          photo_url: student.imageUrl || null,
          student_number: student.student_number || null
        }))

        const { error: insertError } = await supabase
          .from('students')
          .insert(newStudentsData)

        if (insertError) {
          console.error('Error adding students:', insertError)
          alert("학생 추가 중 오류가 발생했습니다.")
          return
        }
      }

      // 6. 수정 처리
      if (studentsToUpdate.length > 0) {
        for (const student of studentsToUpdate) {
          const { error: updateError } = await supabase
            .from('students')
            .update({
              name: student.name.trim(),
              photo_url: student.imageUrl || null,
              student_number: student.student_number || null
            })
            .eq('id', student.student_id)

          if (updateError) {
            console.error('Error updating student:', updateError)
            alert(`학생 ${student.name} 수정 중 오류가 발생했습니다.`)
            return
          }
        }
      }

      // 7. 성공 시 데이터 새로고침
      await loadClassroomData(teacherName)
      alert("학급 정보가 성공적으로 수정되었습니다.")

    } catch (error) {
      console.error('Error updating classroom:', error)
      alert("수정 중 오류가 발생했습니다.")
    }
  }

  return (
    <Card className="p-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer hover:bg-accent/50 p-2 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">학급 관리</h2>
              {hasExistingClassroom && (
                <div className="text-sm text-muted-foreground">
                  {school} {grade}학년 {classNumber}반
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!hasExistingClassroom && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  설정 필요
                </span>
              )}
              <span className="text-sm text-muted-foreground">
                {isOpen ? "접기" : "펼치기"}
              </span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-6 mt-4">
          {/* 학교 입력 */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">학교</h3>
            <KoreanInput
              type="text"
              placeholder="학교를 입력해주세요."
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            />
          </div>

          {/* 학급 선택 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">학급</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">학년</label>
                <KoreanInput
                  type="text"
                  placeholder="1"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">반</label>
                <KoreanInput
                  type="text"
                  placeholder="1"
                  value={classNumber}
                  onChange={(e) => setClassNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 학생 정보 입력 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">학생 정보</h3>
              <Button 
                onClick={addStudentInput}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                학생 추가
              </Button>
            </div>
            
            {/* 학생 입력 목록 */}
            <div className="space-y-3">
              {studentInputs.map((studentInput, index) => (
                <div key={studentInput.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <div className="w-[80px]">
                    <KoreanInput
                      type="number"
                      placeholder="번호"
                      value={studentInput.student_number?.toString() || ""}
                      onChange={(e) => updateStudentNumber(studentInput.id, parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <KoreanInput
                      type="text"
                      placeholder="학생 이름을 입력하세요"
                      value={studentInput.name}
                      onChange={(e) => updateStudentName(studentInput.id, e.target.value)}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateStudentImage(studentInput.id, e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id={`image-${studentInput.id}`}
                      />
                      {studentInput.image ? (
                        <div className="flex items-center gap-2 p-3 border border-border rounded-xl bg-input">
                          <img 
                            src={URL.createObjectURL(studentInput.image)} 
                            alt="Student preview"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-sm text-foreground truncate">
                            {studentInput.image.name}
                          </span>
                        </div>
                      ) : studentInput.imageUrl ? (
                        <div className="flex items-center gap-2 p-3 border border-border rounded-xl bg-input">
                          <img 
                            src={studentInput.imageUrl} 
                            alt="Student"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-sm text-foreground truncate">
                            기존 이미지
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 border border-border rounded-xl bg-input hover:bg-accent transition-colors">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            사진을 선택하세요
                          </span>
                        </div>
                        )}
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>학생 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          {studentInput.name || '이 학생'}을(를) 삭제하시겠습니까?
                          {studentInput.student_id && (
                            <>
                              <br />
                              <strong className="text-destructive">
                                주의: 이 학생과 관련된 모든 설문 응답 데이터가 함께 삭제됩니다.
                              </strong>
                            </>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteStudent(studentInput)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
              
              {studentInputs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">학생 추가 버튼을 눌러 학생을 등록하세요</p>
                </div>
              )}
            </div>
          </div>

          {/* 버튼 섹션 */}
          <div className="space-y-4 pt-4">
            {/* 학급 정보 저장/수정 버튼 */}
            {hasExistingClassroom ? (
              <Button 
                onClick={handleUpdateClassroom}
                variant="outline" 
                className="w-full h-12"
              >
                학급 정보 수정하기
              </Button>
            ) : (
              <Button 
                onClick={handleSaveClassroom}
                variant="outline" 
                className="w-full h-12"
              >
                학급 정보 저장하기
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}