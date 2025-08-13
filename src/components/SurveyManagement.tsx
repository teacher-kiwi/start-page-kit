import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, BarChart3, TrendingUp } from "lucide-react"

interface SurveyManagementProps {
  school: string
  grade: string
  classNumber: string
  teacherName: string
}

export const SurveyManagement = ({
  school,
  grade,
  classNumber,
  teacherName
}: SurveyManagementProps) => {
  const navigate = useNavigate()
  const [surveyRounds, setSurveyRounds] = useState<Array<{ id: string, name: string, date: string }>>([
    { id: "1", name: "1차 설문", date: "2024-01-15" },
    { id: "2", name: "2차 설문", date: "2024-02-15" }
  ])

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

  const addNewRound = () => {
    const newRoundNumber = surveyRounds.length + 1
    const newRound = {
      id: Date.now().toString(),
      name: `${newRoundNumber}차 설문`,
      date: new Date().toISOString().split('T')[0]
    }
    setSurveyRounds([...surveyRounds, newRound])
  }

  const viewRoundResults = (roundId: string, roundName: string) => {
    // 개별 회차 결과 페이지로 이동 (추후 구현)
    console.log(`Viewing results for ${roundName}`)
    navigate('/results')
  }

  const viewComprehensiveResults = () => {
    // 종합 결과 페이지로 이동
    navigate('/results')
  }

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-foreground">설문 관리</h2>
      
      {/* 설문지 생성 섹션 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">새 설문 생성</h3>
        <Button 
          onClick={handleCreateSurvey}
          variant="korean" 
          className="w-full h-12"
        >
          설문지 생성하기
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          설문지와 함께 QR코드가 생성됩니다.
        </p>
      </div>

      {/* 회차별 결과 확인 섹션 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">회차별 결과 확인</h3>
          <Button 
            onClick={addNewRound}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            회차 추가
          </Button>
        </div>
        
        <div className="space-y-3">
          {surveyRounds.map((round) => (
            <div key={round.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-medium text-foreground">{round.name}</h4>
                  <p className="text-sm text-muted-foreground">{round.date}</p>
                </div>
              </div>
              <Button 
                onClick={() => viewRoundResults(round.id, round.name)}
                variant="outline"
                size="sm"
              >
                결과 보기
              </Button>
            </div>
          ))}
          
          {surveyRounds.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">회차 추가 버튼을 눌러 설문 회차를 추가하세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 종합 결과 확인 섹션 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">종합 결과 확인</h3>
        <Button 
          onClick={viewComprehensiveResults}
          variant="outline" 
          className="w-full h-12 flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          모든 설문 결과 종합 보기
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          모든 회차의 설문 결과를 종합하여 분석합니다.
        </p>
      </div>
    </Card>
  )
}