import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, BarChart3, TrendingUp, QrCode, Settings } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface SurveyManagementProps {
  school: string
  grade: string
  classNumber: string
  teacherName: string
}

interface Question {
  id: string
  question_text: string
  is_default: boolean
}

interface QuestionWithWeight extends Question {
  weight: number
}

export const SurveyManagement = ({
  school,
  grade,
  classNumber,
  teacherName
}: SurveyManagementProps) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [surveyRounds, setSurveyRounds] = useState<Array<{ id: string, name: string, date: string }>>([
    { id: "1", name: "1차 설문", date: "2024-01-15" },
    { id: "2", name: "2차 설문", date: "2024-02-15" }
  ])
  const [selectedRoundForQR, setSelectedRoundForQR] = useState<{ id: string, name: string } | null>(null)
  
  // 설문 커스텀 관련 상태
  const [showCustomDialog, setShowCustomDialog] = useState(false)
  const [defaultQuestions, setDefaultQuestions] = useState<Question[]>([])
  const [selectedQuestionsWithWeights, setSelectedQuestionsWithWeights] = useState<QuestionWithWeight[]>([])
  const [surveyTitle, setSurveyTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [customQuestion, setCustomQuestion] = useState("")
  const [customQuestions, setCustomQuestions] = useState<QuestionWithWeight[]>([])

  // 기본 설문 문항 로드
  useEffect(() => {
    loadDefaultQuestions()
  }, [])

  const loadDefaultQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('is_default', true)
        .order('created_at')

      if (error) throw error
      setDefaultQuestions(data || [])
      setSelectedQuestionsWithWeights(data?.map(q => ({ ...q, weight: 1 })) || [])
    } catch (error) {
      console.error('Error loading questions:', error)
      toast({
        title: "오류",
        description: "기본 설문 문항을 불러오는데 실패했습니다.",
        variant: "destructive"
      })
    }
  }

  const handleShowCustomDialog = () => {
    setShowCustomDialog(true)
    setSurveyTitle(`${surveyRounds.length + 1}차 설문`)
    setSelectedQuestionsWithWeights(defaultQuestions.map(q => ({ ...q, weight: 1 })))
    setCustomQuestions([])
    setCustomQuestion("")
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

  const handleCreateSurvey = async () => {
    if (!surveyTitle.trim()) {
      toast({
        title: "입력 오류",
        description: "설문 제목을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    if (selectedQuestionsWithWeights.length === 0 && customQuestions.length === 0) {
      toast({
        title: "입력 오류", 
        description: "최소 하나의 문항을 선택해주세요.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // 여기서 실제 설문 생성 로직을 구현할 수 있습니다
      // 현재는 로컬 상태만 업데이트
      const newRound = {
        id: Date.now().toString(),
        name: surveyTitle,
        date: new Date().toISOString().split('T')[0]
      }
      setSurveyRounds([...surveyRounds, newRound])
      
      toast({
        title: "성공",
        description: "새로운 설문이 생성되었습니다."
      })
      
      setShowCustomDialog(false)
      setSurveyTitle("")
      setSelectedQuestionsWithWeights([])
      setCustomQuestions([])
      setCustomQuestion("")
    } catch (error) {
      console.error('Error creating survey:', error)
      toast({
        title: "오류",
        description: "설문 생성에 실패했습니다.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionsWithWeights(prev => {
      const exists = prev.find(q => q.id === questionId)
      if (exists) {
        return prev.filter(q => q.id !== questionId)
      } else {
        const question = defaultQuestions.find(q => q.id === questionId)
        if (question) {
          return [...prev, { ...question, weight: 1 }]
        }
        return prev
      }
    })
  }

  const updateQuestionWeight = (questionId: string, weight: number) => {
    setSelectedQuestionsWithWeights(prev => 
      prev.map(q => q.id === questionId ? { ...q, weight } : q)
    )
  }

  const updateCustomQuestionWeight = (index: number, weight: number) => {
    setCustomQuestions(prev => 
      prev.map((q, i) => i === index ? { ...q, weight } : q)
    )
  }

  const addCustomQuestion = () => {
    if (!customQuestion.trim()) {
      toast({
        title: "입력 오류",
        description: "추가 문항을 입력해주세요.",
        variant: "destructive"
      })
      return
    }

    const newQuestion: QuestionWithWeight = {
      id: `custom-${Date.now()}`,
      question_text: customQuestion.trim(),
      is_default: false,
      weight: 1
    }

    setCustomQuestions(prev => [...prev, newQuestion])
    setCustomQuestion("")
  }

  const removeCustomQuestion = (index: number) => {
    setCustomQuestions(prev => prev.filter((_, i) => i !== index))
  }

  const viewRoundResults = (roundId: string, roundName: string) => {
    // 개별 회차 결과 페이지로 이동 (추후 구현)
    console.log(`Viewing results for ${roundName}`)
    navigate('/results')
  }

  const showQRCode = (roundId: string, roundName: string) => {
    setSelectedRoundForQR({ id: roundId, name: roundName })
  }

  const getQRCodeURL = () => {
    if (!selectedRoundForQR) return ""
    
    // QR코드 URL 생성 (실제 구현 시 설문 ID와 함께)
    const params = new URLSearchParams({
      school,
      grade,
      class: classNumber,
      teacher: teacherName,
      round: selectedRoundForQR.id
    })
    return `${window.location.origin}/survey?${params.toString()}`
  }

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-foreground">설문 관리</h2>
      
      {/* 회차별 결과 확인 섹션 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">회차별 결과 확인</h3>
          <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleShowCustomDialog}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                회차 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  설문 커스텀
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* 설문 제목 입력 */}
                <div className="space-y-2">
                  <Label htmlFor="survey-title">설문 제목</Label>
                  <Input
                    id="survey-title"
                    value={surveyTitle}
                    onChange={(e) => setSurveyTitle(e.target.value)}
                    placeholder="설문 제목을 입력하세요"
                  />
                </div>

                {/* 문항 선택 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">기본 설문 문항 선택</Label>
                    <div className="text-sm text-muted-foreground">
                      {selectedQuestionsWithWeights.length}/{defaultQuestions.length} 선택됨
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                    {defaultQuestions.map((question, index) => {
                      const selectedQuestion = selectedQuestionsWithWeights.find(q => q.id === question.id)
                      const isSelected = !!selectedQuestion
                      
                      return (
                        <div key={question.id} className="space-y-2">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              id={`question-${question.id}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleQuestionSelection(question.id)}
                            />
                            <div className="flex-1 grid gap-1.5 leading-none">
                              <Label 
                                htmlFor={`question-${question.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {index + 1}. {question.question_text}
                              </Label>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="ml-8 flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">점수:</Label>
                              <Input
                                type="number"
                                value={selectedQuestion.weight}
                                onChange={(e) => updateQuestionWeight(question.id, Number(e.target.value))}
                                className="w-20 h-8 text-xs"
                                placeholder="1"
                              />
                              <span className="text-xs text-muted-foreground">(음수: 부정, 양수: 긍정)</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    
                    {defaultQuestions.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">기본 설문 문항이 없습니다.</p>
                      </div>
                    )}
                  </div>

                  {/* 추가 문항 섹션 */}
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-semibold">추가 문항</Label>
                    
                    {/* 추가 문항 입력 */}
                    <div className="flex gap-2">
                      <Input
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="새로운 문항을 입력하세요"
                        className="flex-1"
                      />
                      <Button
                        onClick={addCustomQuestion}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* 추가된 문항 목록 */}
                    {customQuestions.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                        {customQuestions.map((question, index) => (
                          <div key={question.id} className="space-y-2">
                            <div className="flex items-start justify-between">
                              <Label className="text-sm flex-1">
                                {defaultQuestions.length + index + 1}. {question.question_text}
                              </Label>
                              <Button
                                onClick={() => removeCustomQuestion(index)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                ×
                              </Button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">점수:</Label>
                              <Input
                                type="number"
                                value={question.weight}
                                onChange={(e) => updateCustomQuestionWeight(index, Number(e.target.value))}
                                className="w-20 h-8 text-xs"
                                placeholder="1"
                              />
                              <span className="text-xs text-muted-foreground">(음수: 부정, 양수: 긍정)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 버튼들 */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowCustomDialog(false)}
                    disabled={loading}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleCreateSurvey}
                    disabled={loading || (selectedQuestionsWithWeights.length === 0 && customQuestions.length === 0)}
                  >
                    {loading ? "생성 중..." : "설문 생성"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => showQRCode(round.id, round.name)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      QR코드 보기
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>{round.name} QR코드</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center space-y-4 py-4">
                      <div className="w-64 h-64 border-2 border-border rounded-lg flex items-center justify-center bg-white">
                        <div className="text-center">
                          <QrCode className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">QR코드 생성 예정</p>
                          <p className="text-xs text-muted-foreground mt-1">{getQRCodeURL()}</p>
                        </div>
                      </div>
                      <p className="text-sm text-center text-muted-foreground">
                        학생들이 이 QR코드를 스캔하여 {round.name}에 참여할 수 있습니다.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  onClick={() => viewRoundResults(round.id, round.name)}
                  variant="outline"
                  size="sm"
                >
                  결과 보기
                </Button>
              </div>
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
          onClick={() => navigate('/results')}
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