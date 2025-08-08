import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { KoreanInput } from "@/components/ui/korean-input"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus } from "lucide-react"

interface Student {
  id: string
  name: string
}

const Dashboard = () => {
  const [teacherName, setTeacherName] = useState<string>("")
  const [school, setSchool] = useState<string>("")
  const [selectedGrade, setSelectedGrade] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [newStudentName, setNewStudentName] = useState<string>("")
  const navigate = useNavigate()

  const grades = ["1학년", "2학년", "3학년", "4학년", "5학년", "6학년"]
  const classes = ["1반", "2반", "3반", "4반", "5반", "6반"]

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

  const addStudent = () => {
    if (newStudentName.trim()) {
      const newStudent: Student = {
        id: Date.now().toString(),
        name: newStudentName.trim()
      }
      setStudents([...students, newStudent])
      setNewStudentName("")
    }
  }

  const removeStudent = (id: string) => {
    setStudents(students.filter(student => student.id !== id))
  }

  const handleCreateClass = () => {
    if (school && selectedGrade && selectedClass) {
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
            
            {/* 학년 선택 */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">학년</p>
              <div className="grid grid-cols-3 gap-2">
                {grades.map((grade) => (
                  <Button
                    key={grade}
                    variant={selectedGrade === grade ? "korean" : "outline"}
                    size="sm"
                    onClick={() => setSelectedGrade(grade)}
                    className="h-10"
                  >
                    {grade}
                  </Button>
                ))}
              </div>
            </div>

            {/* 반 선택 */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">반</p>
              <div className="grid grid-cols-3 gap-2">
                {classes.map((classNum) => (
                  <Button
                    key={classNum}
                    variant={selectedClass === classNum ? "korean" : "outline"}
                    size="sm"
                    onClick={() => setSelectedClass(classNum)}
                    className="h-10"
                  >
                    {classNum}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* 학생 정보 입력 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">학생 정보</h2>
            
            {/* 학생 추가 */}
            <div className="flex gap-2">
              <KoreanInput
                type="text"
                placeholder="학생 이름을 입력하세요"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addStudent()}
                className="flex-1"
              />
              <Button 
                onClick={addStudent}
                variant="outline"
                size="sm"
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* 학생 목록 */}
            {students.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">등록된 학생 ({students.length}명)</p>
                <div className="flex flex-wrap gap-2">
                  {students.map((student) => (
                    <Badge
                      key={student.id}
                      variant="secondary"
                      className="flex items-center gap-2 px-3 py-1"
                    >
                      {student.name}
                      <button
                        onClick={() => removeStudent(student.id)}
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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