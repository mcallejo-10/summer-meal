'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Utensils, CheckCircle, BarChart3, Settings, ChefHat } from 'lucide-react'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-gray-800 hover:text-orange-500 transition-colors flex items-center gap-2">
                <Utensils className="text-orange-500" size={24} />
                Summer Meal
              </Link>
            </div>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/menus"
              className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <Utensils size={18} />
              Menús
            </Link>
            <Link
              href="/votar"
              className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Votar
            </Link>
            <Link
              href="/resultats"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <BarChart3 size={18} />
              Resultats
            </Link>
            <Link
              href="/login"
              className="text-gray-700 hover:text-gray-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
            >
              <Settings size={18} />
              Admin
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-orange-600 focus:outline-none focus:text-orange-600"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            <Link
              href="/menus"
              className="text-gray-700 hover:text-orange-600 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Utensils size={18} />
              Menús
            </Link>
            <Link
              href="/votar"
              className="text-gray-700 hover:text-green-600 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <CheckCircle size={18} />
              Votar
            </Link>
            <Link
              href="/resultats"
              className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <BarChart3 size={18} />
              Resultats
            </Link>
            <Link
              href="/login"
              className="text-gray-700 hover:text-gray-600 block px-3 py-2 rounded-md text-base font-medium flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Settings size={18} />
              Admin
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}