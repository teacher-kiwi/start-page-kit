
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { KoreanInput } from "@/components/ui/korean-input"
import { Trash2, Plus, Upload } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface StudentInput {
  id: string
  name: string
  image: File | null
  imageUrl?: string
  student_id?: string
}

interface Classroom {
  id: string
  teacher_name: string
  school: string
  grade: string
  class_number: string
}

interface Student {
  id: string
  name: string
  classroom_id: string
  image_url?: string
}

const Dashboard = () => {
  const [teacherName, setTeacherName] = useState<string>("")
  const [school, setSchool] = useState<string>("")
  const [grade, setGrade] = useState<string>("")
  const [classNumber, setClassNumber] = useState<string>("")
  const [studentInputs, setStudentInputs] = useState<StudentInput[]>([])
  const [classroomId, setClassroomId] = useState<string>("")
  const [hasExistingClassroom, setHasExistingClassroom] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  const addStudentInput = () => {
    const newStudentInput: StudentInput = {
      id: Date.now().toString(),
      name: "",
      image: null
    }
    setStudentInputs([...studentInputs, newStudentInput])
  }

  const loadClassroomData = async (teacherName: string) => {
    try {
      // classrooms 테이블에서 선생님 이름으로 조회
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_name', teacherName)
        .single()

      if (classroomError || !classroom) {
        console.log('No classroom found for teacher:', teacherName)
        setHasExistingClassroom(false)
        setLoading(false)
        return
      }

      // 기존 클래스룸이 있는 경우
      setHasExistingClassroom(true)
      setClassroomId(classroom.id)
      setSchool(classroom.school_name || '')
      setGrade(classroom.grade?.toString() || '')
      setClassNumber(classroom.class_number?.toString() || '')

      // students 테이블에서 해당 클래스룸의 학생들 조회
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('classroom_id', classroom.id)

      if (studentsError) {
        console.error('Error loading students:', studentsError)
      } else if (students) {
        // 학생 데이터를 폼 형식으로 변환
        const studentInputsData = students.map((student, index) => ({
          id: `student-${student.id}`,
          name: student.name,
          image: null, // 이미지는 파일 객체가 아니므로 null로 설정
          imageUrl: student.photo_url || undefined, // 기존 이미지 URL
          student_id: student.id
        }))
        setStudentInputs(studentInputsData)
      }
    } catch (error) {
      console.error('Error loading classroom data:', error)
      setHasExistingClassroom(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const deriveName = (session: any) => {
      const meta = session?.user?.user_metadata || {}
      return (
        meta.name ||
        meta.full_name ||
        meta.preferred_username ||
        (session?.user?.email ? session.user.email.split("@")[0] : "")
      )
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      if (session) {
        const name = deriveName(session)
        setTeacherName(name)
        loadClassroomData(name)
      } else {
        navigate("/")
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session) {
        const name = deriveName(session)
        setTeacherName(name)
        loadClassroomData(name)
      } else {
        navigate("/")
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  }

  const removeStudentInput = (id: string) => {
    setStudentInputs(studentInputs.filter(input => input.id !== id))
  }

  const updateStudentName = (id: string, name: string) => {
    setStudentInputs(studentInputs.map(input => 
      input.id === id ? { ...input, name } : input
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
      const { data: classroom, error: classroomError } = await supabase
        .from('classrooms')
        .insert({
          teacher_name: teacherName,
          school_name: school,
          grade: parseInt(grade),
          class_number: parseInt(classNumber)
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
            photo_url: student.imageUrl || null // 업로드된 이미지 URL
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

      // 3. 성공 시 상태 업데이트
      setClassroomId(classroom.id)
      setHasExistingClassroom(true)
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
          currentStudent.photo_url !== (input.imageUrl || null)
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
          photo_url: student.imageUrl || null
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
              photo_url: student.imageUrl || null
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

  const handleCreateSurvey = () => {
    if (school && grade && classNumber) {
      // QR코드 페이지로 이동하면서 학급 정보를 쿼리 파라미터로 전달
      const params = new URLSearchParams({
        school,
        grade,
        class: classNumber,
        teacher: teacherName
      })
      navigate(`/qrcode?${params.toString()}`)
    } else {
      alert("모든 정보를 입력해주세요.")
    }
  }

  if (!teacherName || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">학급 관리</h1>
            <p className="text-muted-foreground mt-1">{teacherName} 선생님</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            size="sm"
          >
            로그아웃
          </Button>
        </div>

        <Card className="p-8 space-y-8">
          {/* 학교 입력 */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">학교</h2>
            <KoreanInput
              type="text"
              placeholder="학교를 입력해주세요."
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            />
          </div>

          {/* 학급 선택 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">학급</h2>
            
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
              <h2 className="text-lg font-semibold text-foreground">학생 정보</h2>
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
                  <span className="text-sm font-medium text-foreground min-w-[60px]">
                    {index + 1}
                  </span>
                  
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
                  
                  <button
                    onClick={() => removeStudentInput(studentInput.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
            
            {/* 설문지 생성 버튼 */}
            <Button 
              onClick={handleCreateSurvey}
              variant="korean" 
              className="w-full h-12"
            >
              설문지 생성하기
            </Button>
            
            {/* 결과 보기 버튼 */}
            <Button 
              onClick={() => navigate('/results')}
              variant="outline" 
              className="w-full h-12"
            >
              설문 결과 보기
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              설문지와 함께 QR코드가 생성됩니다.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
