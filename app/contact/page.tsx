'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import { 
  ArrowLeft, 
  Mail, 
  CheckCircle, 
  Phone, 
  Clock,
  MessageCircle
} from 'lucide-react'
import LandingNav from '@/components/layout/LandingNav'

const contactChannels = [
  {
    icon: Mail,
    title: 'Email Us',
    description: 'Send us an email anytime',
    contact: 'contact@foraypay.com',
    link: 'mailto:contact@foraypay.com',
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    icon: Phone,
    title: 'Call Us',
    description: 'Mon-Fri 9am-5pm',
    contact: '+232 XX XXX XXXX',
    link: 'tel:+232XXXXXXXXX',
    color: 'text-success-600',
    bgColor: 'bg-success-50',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    description: 'Chat with us instantly',
    contact: '+232 XX XXX XXXX',
    link: 'https://wa.me/232XXXXXXXXX',
    color: 'text-success-600',
    bgColor: 'bg-success-50',
  },
  {
    icon: Clock,
    title: 'Business Hours',
    description: 'When we\'re available',
    contact: 'Mon-Fri: 9am - 5pm',
    link: '#',
    color: 'text-info-600',
    bgColor: 'bg-info-50',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Navigation */}
      <LandingNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/landing">
            <button className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group">
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Landing Page</span>
            </button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We&apos;d love to hear from you. Choose your preferred way to reach us.
          </p>
        </div>

        {/* Communication Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {contactChannels.map((channel, index) => {
            const Icon = channel.icon
            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <a
                  href={channel.link}
                  className="block"
                  onClick={(e) => {
                    if (channel.link === '#') {
                      e.preventDefault()
                    }
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`${channel.bgColor} p-3 rounded-lg flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${channel.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {channel.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {channel.description}
                      </p>
                      <p className="text-sm font-medium text-primary-600">
                        {channel.contact}
                      </p>
                    </div>
                  </div>
                </a>
              </Card>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Why Contact Us?</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Get answers to your questions about our platform</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Request a demo or consultation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Report issues or provide feedback</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-success-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Learn about partnership opportunities</span>
                </li>
              </ul>
            </Card>

            <Card className="p-8 bg-primary-50 border-primary-200">
              <div className="flex items-start">
                <Clock className="h-6 w-6 text-primary-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Time</h3>
                  <p className="text-gray-700 mb-1">
                    <strong>Email:</strong> We typically respond within 24-48 hours
                  </p>
                  <p className="text-gray-700 mb-1">
                    <strong>WhatsApp:</strong> Usually within a few hours during business hours
                  </p>
                  <p className="text-gray-700">
                    <strong>Phone:</strong> Available Mon-Fri, 9am-5pm
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
