import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const Dashboard = () => {
  const [teacherName, setTeacherName] = useState<string>("")
  const navigate = useNavigate()

  useEffect(() => {
    const storedTeacherName = localStorage.getItem("teacher_name")
    if (!storedTeacherName) {
      // 로그인하지 않은 경우 로그인 페이지로 리디렉션
      navigate("/")
      return
    }
    setTeacherName(storedTeacherName)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("teacher_name")
    navigate("/")
  }

  if (!teacherName) {
    return null // 로딩 중이거나 리디렉션 중
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">대시보드</h1>
            <p className="text-muted-foreground mt-1">안녕하세요, {teacherName} 선생님!</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
          >
            로그아웃
          </Button>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">수업 관리</h3>
            <p className="text-muted-foreground mb-4">수업을 생성하고 관리하세요</p>
            <Button variant="korean" className="w-full">
              수업 보기
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">학생 관리</h3>
            <p className="text-muted-foreground mb-4">학생 정보를 확인하고 관리하세요</p>
            <Button variant="korean" className="w-full">
              학생 목록
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">성적 관리</h3>
            <p className="text-muted-foreground mb-4">학생들의 성적을 관리하세요</p>
            <Button variant="korean" className="w-full">
              성적 보기
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Dashboard