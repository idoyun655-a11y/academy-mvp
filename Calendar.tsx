import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { useToast } from "@/components/ui/use-toast";

interface CalendarEvent {
  id: number;
  date: Date;
  title: string;
  type: "exam" | "event" | "holiday" | "attendance";
  description?: string;
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"exam" | "event">("exam");
  const [editingId, setEditingId] = useState<number | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "event",
    startDate: "",
    endDate: "",
  });

  // const { toast } = useToast();
  const toast = (config: any) => {
    console.log(config.title, config.description);
    alert(`${config.title}: ${config.description}`);
  };

  // API 호출
  const examsQuery = trpc.calendar.listExams.useQuery();
  const eventsQuery = trpc.calendar.listEvents.useQuery();
  const createExamMutation = trpc.calendar.createExam.useMutation();
  const updateExamMutation = trpc.calendar.updateExam.useMutation();
  const deleteExamMutation = trpc.calendar.deleteExam.useMutation();
  const createEventMutation = trpc.calendar.createEvent.useMutation();
  const updateEventMutation = trpc.calendar.updateEvent.useMutation();
  const deleteEventMutation = trpc.calendar.deleteEvent.useMutation();

  // 현재 월의 첫 날과 마지막 날
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // 캘린더 이벤트 병합
  const events: CalendarEvent[] = [
    ...(examsQuery.data?.map((exam: any) => ({
      id: exam.id,
      date: new Date(exam.examDate),
      title: exam.examName,
      type: "exam" as const,
      description: exam.subject,
    })) || []),
    ...(eventsQuery.data?.map((event: any) => ({
      id: event.id,
      date: new Date(event.eventDate),
      title: event.eventName,
      type: event.eventType as "event" | "holiday",
      description: event.description,
    })) || []),
  ];

  // 날짜별 이벤트 그룹화
  const eventsByDate = new Map<string, CalendarEvent[]>();
  events.forEach((event) => {
    const dateKey = event.date.toDateString();
    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey)!.push(event);
  });

  // 이전/다음 월 이동
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // 모달 열기
  const openModal = (type: "exam" | "event", date: Date, eventId?: number) => {
    setModalType(type);
    setSelectedDate(date);
    setEditingId(eventId || null);

    if (eventId) {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setFormData({
          title: event.title,
          description: event.description || "",
          eventType: event.type === "exam" ? "exam" : event.type,
          startDate: date.toISOString().split('T')[0],
          endDate: "",
        });
      }
    } else {
      setFormData({ 
        title: "", 
        description: "", 
        eventType: type,
        startDate: date.toISOString().split('T')[0],
        endDate: "",
      });
    }

    setShowModal(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setFormData({ title: "", description: "", eventType: "event", startDate: "", endDate: "" });
    setEditingId(null);
  };

  // 저장
  const handleSave = async () => {
    if (!formData.title.trim() || !selectedDate) {
      toast({
        title: "오류",
        description: "제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (modalType === "exam") {
        if (editingId) {
          await updateExamMutation.mutateAsync({
            id: editingId,
            examName: formData.title,
            examDate: selectedDate.toISOString().split('T')[0],
            examEndDate: formData.endDate || undefined,
            subject: formData.description,
          });
          toast({
            title: "성공",
            description: "시험일정이 수정되었습니다.",
          });
        } else {
          await createExamMutation.mutateAsync({
            examName: formData.title,
            examDate: selectedDate.toISOString().split('T')[0],
            examEndDate: formData.endDate || undefined,
            subject: formData.description,
          });
          toast({
            title: "성공",
            description: "시험일정이 추가되었습니다.",
          });
        }
      } else {
        if (editingId) {
          await updateEventMutation.mutateAsync({
            id: editingId,
            eventName: formData.title,
            eventDate: selectedDate.toISOString().split('T')[0],
            eventEndDate: formData.endDate || undefined,
            eventType: formData.eventType as "event" | "holiday",
            description: formData.description,
          });
          toast({
            title: "성공",
            description: "행사일정이 수정되었습니다.",
          });
        } else {
          await createEventMutation.mutateAsync({
            eventName: formData.title,
            eventDate: selectedDate.toISOString().split('T')[0],
            eventEndDate: formData.endDate || undefined,
            eventType: formData.eventType as "event" | "holiday",
            description: formData.description,
          });
          toast({
            title: "성공",
            description: "행사일정이 추가되었습니다.",
          });
        }
      }

      // 데이터 새로고침
      await examsQuery.refetch();
      await eventsQuery.refetch();
      closeModal();
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 삭제
  const handleDelete = async (eventId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      if (modalType === "exam") {
        await deleteExamMutation.mutateAsync({ id: eventId });
      } else {
        await deleteEventMutation.mutateAsync({ id: eventId });
      }

      toast({
        title: "성공",
        description: "일정이 삭제되었습니다.",
      });

      // 데이터 새로고침
      await examsQuery.refetch();
      await eventsQuery.refetch();
      closeModal();
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 날짜 셀 생성
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // 요일 헤더
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  // 이벤트 타입별 색상
  const getEventColor = (type: string) => {
    switch (type) {
      case "exam":
        return "bg-red-100 text-red-800 border-red-300";
      case "holiday":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "event":
        return "bg-green-100 text-green-800 border-green-300";
      case "attendance":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <>
      <Card className="p-6 bg-white dark:bg-slate-950">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousMonth}
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-sm py-2 text-slate-600 dark:text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square bg-slate-50 dark:bg-slate-900 rounded"
                />
              );
            }

            const date = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              day
            );
            const dateKey = date.toDateString();
            const dayEvents = eventsByDate.get(dateKey) || [];
            const isToday =
              date.toDateString() === new Date().toDateString();
            const isSelected =
              selectedDate?.toDateString() === date.toDateString();

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(date)}
                className={`
                  aspect-square p-2 rounded border-2 cursor-pointer transition-all
                  ${isToday ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700"}
                  ${isSelected ? "ring-2 ring-blue-400" : ""}
                  hover:bg-slate-100 dark:hover:bg-slate-800
                `}
              >
                <div className="text-sm font-semibold mb-1">{day}</div>
                <div className="space-y-0.5 overflow-y-auto max-h-12">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`
                        text-xs px-1 py-0.5 rounded truncate border cursor-pointer hover:opacity-80
                        ${getEventColor(event.type)}
                      `}
                      title={event.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(event.type === "exam" ? "exam" : "event", date, event.id);
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-slate-500 px-1">
                      +{dayEvents.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 선택된 날짜의 이벤트 상세 */}
        {selectedDate && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">
                {selectedDate.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openModal("exam", selectedDate)}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  시험일정
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openModal("event", selectedDate)}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  행사
                </Button>
              </div>
            </div>

            {eventsByDate.get(selectedDate.toDateString())?.length === 0 ? (
              <p className="text-sm text-slate-500">일정이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {eventsByDate.get(selectedDate.toDateString())?.map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border-l-4 flex items-start justify-between ${getEventColor(event.type)}`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{event.title}</div>
                      {event.description && (
                        <div className="text-sm mt-1">{event.description}</div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openModal(event.type === "exam" ? "exam" : "event", selectedDate, event.id)}
                        className="h-6 w-6 p-0"
                      >
                        ✏️
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(event.id)}
                        className="h-6 w-6 p-0"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 모달 */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "일정 수정" : "일정 추가"} - {modalType === "exam" ? "시험일정" : "행사"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">제목</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="제목을 입력하세요"
              />
            </div>

            {modalType === "event" && (
              <div>
                <label className="text-sm font-medium">유형</label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, eventType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">행사</SelectItem>
                    <SelectItem value="holiday">휴일</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">설명</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="설명을 입력하세요"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeModal}>
                취소
              </Button>
              {editingId && (
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(editingId)}
                >
                  삭제
                </Button>
              )}
              <Button onClick={handleSave}>
                {editingId ? "수정" : "추가"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
