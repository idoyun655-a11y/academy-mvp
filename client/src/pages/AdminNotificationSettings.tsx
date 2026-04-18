import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Plus, Trash2, Edit } from "lucide-react";

const NOTIFICATION_TEMPLATES = [
  {
    id: 1,
    templateId: "class_start",
    name: "수업 시작 알림",
    content: "[#{academyName}] #{className} 수업이 #{startTime}에 시작됩니다. 장소: #{room}",
    provider: "kakao_talk",
    enabled: true,
  },
  {
    id: 2,
    templateId: "payment_due",
    name: "수강료 납부 안내",
    content: "[#{academyName}] #{studentName}님의 #{month}월 수강료 납부 기한이 #{dueDate}입니다.",
    provider: "kakao_talk",
    enabled: true,
  },
  {
    id: 3,
    templateId: "attendance_report",
    name: "출결 결과 안내",
    content: "[#{academyName}] #{studentName}님의 #{date} #{className} 출석 상태: #{status}",
    provider: "kakao_talk",
    enabled: true,
  },
  {
    id: 4,
    templateId: "unpaid_notice",
    name: "미납 안내",
    content: "[#{academyName}] #{studentName}님의 미납 수강료가 있습니다. 빠른 납부 부탁드립니다.",
    provider: "kakao_talk",
    enabled: false,
  },
];

export default function AdminNotificationSettings() {
  const { user, isAuthenticated } = useAuth();
  const [templates, setTemplates] = useState(NOTIFICATION_TEMPLATES);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");

  if (!isAuthenticated) {
    return <div className="p-8">로그인이 필요합니다.</div>;
  }

  const handleToggle = (id: number) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  };

  const handleEdit = (id: number, content: string) => {
    setEditingId(id);
    setEditingContent(content);
  };

  const handleSave = (id: number) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, content: editingContent } : t));
    setEditingId(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">알림톡 설정</h1>
            <p className="text-muted-foreground mt-1">자동 알림톡 템플릿 관리</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            템플릿 추가
          </Button>
        </div>

        {/* 알림톡 제공자 설정 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>알림톡 제공자 설정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">카카오 알림톡 API 키</label>
                <Input placeholder="API 키 입력" type="password" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">SMS API 키</label>
                <Input placeholder="API 키 입력" type="password" />
              </div>
              <div className="flex items-end">
                <Button className="w-full">저장</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 알림톡 템플릿 목록 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>알림톡 템플릿</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{template.name}</h3>
                      <Badge variant="secondary" className="text-xs">{template.templateId}</Badge>
                      {template.enabled ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">활성</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">비활성</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">제공자: {template.provider}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.enabled}
                      onCheckedChange={() => handleToggle(template.id)}
                    />
                  </div>
                </div>

                {editingId === template.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="min-h-24"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSave(template.id)}
                      >
                        저장
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        취소
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-accent/50 p-3 rounded text-sm text-foreground mb-3 font-mono break-words">
                    {template.content}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(template.id, template.content)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 템플릿 변수 안내 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>템플릿 변수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">학원 정보</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>#{"{academyName}"} - 학원명</li>
                  <li>#{"{academyPhone}"} - 학원 전화번호</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">학생 정보</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>#{"{studentName}"} - 학생명</li>
                  <li>#{"{studentPhone}"} - 학생 전화번호</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">수업 정보</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>#{"{className}"} - 반명</li>
                  <li>#{"{startTime}"} - 시작 시간</li>
                  <li>#{"{room}"} - 강의실</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">기타</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>#{"{date}"} - 날짜</li>
                  <li>#{"{month}"} - 월</li>
                  <li>#{"{status}"} - 상태</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
