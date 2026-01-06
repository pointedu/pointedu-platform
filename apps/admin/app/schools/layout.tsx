import Sidebar from '../../components/Sidebar'

export default function SchoolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50 p-8">{children}</main>
    </div>
  )
}
