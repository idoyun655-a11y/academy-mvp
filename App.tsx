import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminStudents from "@/pages/AdminStudents";
import AdminClasses from "@/pages/AdminClasses";
import AdminAttendance from "@/pages/AdminAttendance";
import AdminNotices from "@/pages/AdminNotices";
import AdminGrades from "./pages/AdminGrades";
import AdminSettings from "./pages/AdminSettings";
import AdminNotificationSettings from "@/pages/AdminNotificationSettings";
import TeacherManagement from "@/pages/TeacherManagement";
import AdminStudentList from "@/pages/AdminStudentList";
import StudentHome from "@/pages/StudentHome";
import StudentSchedule from "@/pages/StudentSchedule";
import StudentNotices from "@/pages/StudentNotices";
import StudentAttendance from "@/pages/StudentAttendance";
import StudentProfile from "@/pages/StudentProfile";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/signup"} component={Signup} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/"} component={Home} />
      {/* Admin Routes */}
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/students"} component={AdminStudentList} />
      <Route path={"/admin/classes"} component={AdminClasses} />
      <Route path={"/admin/teachers"} component={TeacherManagement} />
      <Route path={"/admin/attendance"} component={AdminAttendance} />
      <Route path={"/admin/notices"} component={AdminNotices} />
       <Route path="/admin/grades" component={AdminGrades} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path={"/admin/notifications"} component={AdminNotificationSettings} />
      {/* Student Routes */}
      <Route path={"/student"} component={StudentHome} />
      <Route path={"/student/schedule"} component={StudentSchedule} />
      <Route path={"/student/notices"} component={StudentNotices} />
      <Route path={"/student/attendance"} component={StudentAttendance} />
      <Route path={"/student/profile"} component={StudentProfile} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
