// components/Navbar.tsx
'use client'

export default function Navbar() {
  return (
    <div className="w-full h-10 text-white text-center text-3xl flex items-center" style={{ backgroundColor: 'rgb(41, 44, 53)' }}>
      <div className="float-left ml-12 font-bold" style={{ color: 'rgb(40, 117, 40)' }}>
        CSGOcrash
      </div>
      <div className="ml-auto mr-72 text-xl">
        Coins:
      </div>
      <div className="text-orange-500 mr-12 text-xl cursor-pointer">
        Logout
      </div>
    </div>
  )
}