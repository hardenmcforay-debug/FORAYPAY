'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
}

interface FAQProps {
  items: FAQItem[]
}

export default function FAQ({ items }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-2 md:space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        
        return (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full px-3 md:px-6 py-2 md:py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${index}`}
            >
              <span className="text-sm md:text-base font-semibold text-gray-900 pr-2 md:pr-4">{item.question}</span>
              <div className="flex-shrink-0">
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 md:h-5 md:w-5 text-primary-600 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-gray-400 transition-transform duration-200" />
                )}
              </div>
            </button>
            <div
              id={`faq-answer-${index}`}
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-base text-gray-600 leading-relaxed border-t border-gray-100 whitespace-pre-line">
                {item.answer}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

