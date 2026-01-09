import Sidebar from '../../components/Sidebar'

export default function ProgramsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50 p-4 pt-18 sm:p-6 lg:p-8 lg:pt-8">{children}</main>
    </div>
  )
}
