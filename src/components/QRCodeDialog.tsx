import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import QRCode from "qrcode"
import { Download } from "lucide-react"

interface QRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  school: string
  grade: string
  classNumber: string
  teacherName: string
  roundId: string
  roundName: string
}

export const QRCodeDialog = ({
  open,
  onOpenChange,
  school,
  grade,
  classNumber,
  teacherName,
  roundId,
  roundName
}: QRCodeDialogProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [surveyUrl, setSurveyUrl] = useState<string>("")
  const navigate = useNavigate()

  useEffect(() => {
    if (open && school && grade && classNumber && teacherName && roundId) {
      // 학생들이 접속할 설문지 URL 생성
      const url = `${window.location.origin}/survey?school=${encodeURIComponent(school)}&grade=${grade}&class=${classNumber}&teacher=${encodeURIComponent(teacherName)}&round=${roundId}`
      setSurveyUrl(url)
      
      // QR코드 생성
      QRCode.toDataURL(url, {
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
    }
  }, [open, school, grade, classNumber, teacherName, roundId])

  const handleDownload = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a')
      link.download = `${school}_${grade}학년_${classNumber}반_${roundName}_QR코드.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  const handleQRCodeClick = () => {
    if (surveyUrl) {
      window.open(surveyUrl, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">설문지 QR코드</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              {school} {grade}학년 {classNumber}반
            </p>
            <p className="text-sm text-muted-foreground">
              {teacherName} 선생님 - {roundName}
            </p>
          </div>

          <Card className="p-6">
            <div className="text-center space-y-4">
              {/* QR코드 */}
              <div className="flex justify-center">
                {qrCodeUrl ? (
                  <div 
                    className="p-4 bg-white rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                    onClick={handleQRCodeClick}
                    title="클릭하여 설문 페이지로 이동"
                  >
                    <img 
                      src={qrCodeUrl} 
                      alt="설문지 QR코드" 
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center border border-border rounded-xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>

              {/* 안내 메시지 */}
              <div className="text-left bg-muted p-4 rounded-lg">
                <h3 className="font-medium text-foreground mb-2">사용 방법:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>학생들이 카메라로 QR코드를 스캔합니다</li>
                  <li>또는 QR코드를 클릭하여 직접 이동할 수 있습니다</li>
                  <li>설문지 페이지가 자동으로 열립니다</li>
                  <li>학생들이 자신의 이름을 선택하여 설문에 참여합니다</li>
                </ol>
              </div>

              {/* 다운로드 버튼 */}
              <Button 
                onClick={handleDownload}
                variant="outline"
                disabled={!qrCodeUrl}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                QR코드 이미지 다운로드
              </Button>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}