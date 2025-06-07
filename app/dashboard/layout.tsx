"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FileText, BookOpen, PlusCircle, Settings, LogOut, Notebook, Loader2 } from "lucide-react"
// DropdownMenu components are no longer needed for the user menu in sidebar
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarSeparator, // Ensure this is imported
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  tooltip?: string
  isPrimaryAction?: boolean // New property for highlighting
}

const mainNavItems: NavItem[] = [
  {
    href: "/dashboard/create-course",
    label: "Create Course",
    icon: PlusCircle,
    tooltip: "Create New Course",
    isPrimaryAction: true, // Mark as primary action
  },
  { href: "/dashboard/my-files", label: "My Files", icon: FileText, tooltip: "My Files" },
  { href: "/dashboard/my-courses", label: "My Courses", icon: BookOpen, tooltip: "My Courses" },
]

const accountNavItems: NavItem[] = [
  // Only settings here, user info/logout handled separately
  { href: "/dashboard/settings", label: "Settings", icon: Settings, tooltip: "Settings" },
]

function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  // const router = useRouter(); // Not used in AppSidebar directly anymore

  const getInitials = (name = "") => {
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    )
  }

  return (
    <Sidebar collapsible="icon" className="border-r bg-background">
      <SidebarHeader className="flex h-14 items-center justify-center p-2 lg:h-[60px]">
        <Link
          href="/dashboard/create-course"
          className="flex items-center gap-2 font-semibold"
          aria-label="CourseGen Home"
        >
          <Notebook
            className={cn(
              "h-7 w-7 text-primary transition-all",
              "group-data-[state=expanded]/sidebar-wrapper:mr-1",
              "group-data-[state=collapsed]/sidebar-wrapper:h-7 group-data-[state=collapsed]/sidebar-wrapper:w-7",
            )}
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex-1 pt-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.href ||
                      (item.href !== "/dashboard/create-course" && pathname.startsWith(item.href))
                    }
                    tooltip={{ children: item.tooltip || item.label, side: "right", align: "center" }}
                    className={cn(
                      "justify-start w-full", // Ensure full width for background
                      item.isPrimaryAction &&
                        "bg-primary text-primary-foreground hover:bg-primary/90 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
                      item.isPrimaryAction &&
                        "group-data-[state=collapsed]/sidebar-wrapper:bg-primary group-data-[state=collapsed]/sidebar-wrapper:text-primary-foreground group-data-[state=collapsed]/sidebar-wrapper:hover:bg-primary/90", // Ensure primary style in collapsed state too
                    )}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu className="space-y-1">
          {accountNavItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.tooltip || item.label, side: "right", align: "center" }}
                className="justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          <SidebarSeparator className="my-2 group-data-[state=collapsed]/sidebar-wrapper:mx-auto group-data-[state=collapsed]/sidebar-wrapper:w-4/5" />

          <SidebarMenuItem
            className={cn(
              "group-data-[state=expanded]/sidebar-wrapper:px-2 group-data-[state=expanded]/sidebar-wrapper:py-1.5", // Padding for expanded user info
              "group-data-[state=collapsed]/sidebar-wrapper:py-1", // Padding for collapsed user info
            )}
            aria-label="User information"
          >
            <div
              className={cn(
                "flex items-center space-x-2",
                "group-data-[state=collapsed]/sidebar-wrapper:flex-col group-data-[state=collapsed]/sidebar-wrapper:items-center group-data-[state=collapsed]/sidebar-wrapper:justify-center group-data-[state=collapsed]/sidebar-wrapper:space-x-0 group-data-[state=collapsed]/sidebar-wrapper:space-y-1",
              )}
            >
              <Avatar
                className={cn(
                  "h-7 w-7",
                  "group-data-[state=collapsed]/sidebar-wrapper:h-6 group-data-[state=collapsed]/sidebar-wrapper:w-6",
                )}
              >
                <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} alt={user?.username || "User"} />
                <AvatarFallback>{getInitials(user?.username)}</AvatarFallback>
              </Avatar>
              <span
                className={cn("text-sm font-medium truncate", "group-data-[state=collapsed]/sidebar-wrapper:hidden")}
              >
                {user?.username}
              </span>
            </div>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className={cn(
                "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                "group-data-[state=collapsed]/sidebar-wrapper:justify-center",
              )}
              tooltip={{ children: "Logout", side: "right", align: "center" }}
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
              <span className="group-data-[state=collapsed]/sidebar-wrapper:hidden">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading: authIsLoading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!authIsLoading && !user) {
      router.replace("/login")
    }
  }, [user, authIsLoading, router])

  if (authIsLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen>
      {" "}
      {/* defaultOpen can be true or read from cookie */}
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
            <SidebarTrigger className="md:-ml-1" />
            <Separator orientation="vertical" className="h-6 hidden md:block" />
            {/* Breadcrumbs or page title can go here */}
            <div className="flex-1">{/* Example: <h1 className="text-lg font-semibold">Dashboard</h1> */}</div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
