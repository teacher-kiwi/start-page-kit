import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import QRCode from "qrcode"
import { ArrowLeft } from "lucide-react"

const QRCodePage = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const school = searchParams.get("school")
  const grade = searchParams.get("grade") 
  const classNumber = searchParams.get("class")
  const teacherName = searchParams.get("teacher")

  useEffect(() => {
    if (!school || !grade || !classNumber || !teacherName) {
      navigate("/dashboard")
      return
    }

    // 학생들이 접속할 설문지 URL 생성
    const surveyUrl = `${window.location.origin}/survey?school=${encodeURIComponent(school)}&grade=${grade}&class=${classNumber}&teacher=${encodeURIComponent(teacherName)}`
    
    // QR코드 생성
    QRCode.toDataURL(surveyUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    .then(url => {
      setQrCodeUrl(url)
    })
    .catch(err => {
      console.error('QR코드 생성 오류:', err)
    })
  }, [school, grade, classNumber, teacherName, navigate])

  const handleBackToDashboard = () => {
    navigate("/dashboard")
  }

  const handleQRCodeClick = () => {
    // 현재 URL 파라미터를 그대로 전달하여 설문 페이지로 이동
    const params = new URLSearchParams({
      school: school!,
      grade: grade!,
      class: classNumber!,
      teacher: teacherName!
    })
    navigate(`/survey?${params.toString()}`)
  }

  if (!school || !grade || !classNumber || !teacherName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">잘못된 접근입니다.</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            대시보드로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            onClick={handleBackToDashboard}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            대시보드로 돌아가기
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">설문지 QR코드</h1>
          <p className="text-muted-foreground">
            {school} {grade}학년 {classNumber}반 ({teacherName} 선생님)
          </p>
        </div>

        <Card className="p-8">
          <div className="text-center space-y-6">
            {/* QR코드 */}
            <div className="flex justify-center">
              {qrCodeUrl ? (
                <div 
                  className="p-6 bg-white rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                  onClick={handleQRCodeClick}
                >
                  <img 
                    src={qrCodeUrl} 
                    alt="설문지 QR코드" 
                    className="w-64 h-64 mx-auto"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 flex items-center justify-center border border-border rounded-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </div>

            {/* 안내 메시지 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                학생들에게 QR코드를 보여주세요
              </h2>
              <div className="text-left bg-muted p-4 rounded-lg">
                <h3 className="font-medium text-foreground mb-2">사용 방법:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>학생들이 스마트폰 카메라로 QR코드를 스캔합니다</li>
                  <li>설문지 페이지가 자동으로 열립니다</li>
                  <li>학생들이 자신의 이름을 선택하여 설문에 참여합니다</li>
                </ol>
                
              </div>
            </div>

            {/* 다운로드 버튼 (추후 기능 확장) */}
            <div className="pt-4">
              <Button 
                onClick={() => {
                  if (qrCodeUrl) {
                    const link = document.createElement('a')
                    link.download = `${school}_${grade}학년_${classNumber}반_QR코드.png`
                    link.href = qrCodeUrl
                    link.click()
                  }
                }}
                variant="outline"
                disabled={!qrCodeUrl}
              >
                QR코드 이미지 다운로드
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default QRCodePage