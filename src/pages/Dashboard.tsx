import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { KoreanInput } from "@/components/ui/korean-input"
import { Trash2, Plus, Upload } from "lucide-react"

interface StudentInput {
  id: string
  name: string
  image: File | null
}

const Dashboard = () => {
  const [teacherName, setTeacherName] = useState<string>("")
  const [school, setSchool] = useState<string>("")
  const [grade, setGrade] = useState<string>("")
  const [classNumber, setClassNumber] = useState<string>("")
  const [studentInputs, setStudentInputs] = useState<StudentInput[]>([])
  const navigate = useNavigate()

  const addStudentInput = () => {
    const newStudentInput: StudentInput = {
      id: Date.now().toString(),
      name: "",
      image: null
    }
    setStudentInputs([...studentInputs, newStudentInput])
  }

  useEffect(() => {
    const storedTeacherName = localStorage.getItem("teacher_name")
    if (!storedTeacherName) {
      navigate("/")
      return
    }
    setTeacherName(storedTeacherName)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("teacher_name")
    navigate("/")
  }

  const removeStudentInput = (id: string) => {
    setStudentInputs(studentInputs.filter(input => input.id !== id))
  }

  const updateStudentName = (id: string, name: string) => {
    setStudentInputs(studentInputs.map(input => 
      input.id === id ? { ...input, name } : input
    ))
  }

  const updateStudentImage = (id: string, file: File | null) => {
    setStudentInputs(studentInputs.map(input => 
      input.id === id ? { ...input, image: file } : input
    ))
  }

  const handleCreateClass = () => {
    if (school && grade && classNumber) {
      alert("점문지와 함께 QR코드가 생성됩니다.")
      // 여기에 실제 클래스 생성 로직 추가
    } else {
      alert("모든 정보를 입력해주세요.")
    }
  }

  if (!teacherName) {
    return null
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
            <div className="space-y-4">
              {studentInputs.map((studentInput, index) => (
                <div key={studentInput.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      학생 {index + 1}
                    </span>
                    <button
                      onClick={() => removeStudentInput(studentInput.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {/* 학생 이름 입력 */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">이름</label>
                      <KoreanInput
                        type="text"
                        placeholder="학생 이름을 입력하세요"
                        value={studentInput.name}
                        onChange={(e) => updateStudentName(studentInput.id, e.target.value)}
                      />
                    </div>
                    
                    {/* 학생 이미지 업로드 */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">사진</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => updateStudentImage(studentInput.id, e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex items-center gap-2 p-3 border border-border rounded-xl bg-input hover:bg-accent transition-colors">
                          <Upload className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {studentInput.image ? studentInput.image.name : "사진을 선택하세요"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {studentInputs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">학생 추가 버튼을 눌러 학생을 등록하세요</p>
                </div>
              )}
            </div>
          </div>

          {/* 완전지 생성 버튼 */}
          <div className="space-y-4 pt-4">
            <Button 
              onClick={handleCreateClass}
              variant="korean" 
              className="w-full h-12"
            >
              완전지 생성하기
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              점문지와 함께 QR코드가 생성됩니다.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard