import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/landing">
            <Button variant="ghost" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Landing Page
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using Foraypay, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed">
                Foraypay is a digital transport ticketing platform that enables passengers to purchase tickets for transport services 
                using mobile money payments (MoniMe). The platform facilitates ticket generation, validation, and revenue tracking 
                for transport companies in Sierra Leone and across Africa.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>To use certain features of our service, you may be required to register for an account. You agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your password and identification</li>
                  <li>Accept all responsibility for activities that occur under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Ticket Purchases and Payments</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>When purchasing tickets through Foraypay:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All payments are processed through MoniMe mobile money platform</li>
                  <li>Ticket prices are displayed before purchase and are non-refundable except as required by law</li>
                  <li>Upon successful payment, you will receive an OTP code via SMS</li>
                  <li>You are responsible for presenting the OTP code to the operator for ticket validation</li>
                  <li>Lost or forgotten OTP codes can be retrieved using your phone number or transaction ID</li>
                  <li>Tickets are valid only for the specified route and date</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Ticket Validation and Use</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>You agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Present your OTP code to the park operator for validation before boarding</li>
                  <li>Use tickets only for the intended route and date</li>
                  <li>Not attempt to use a ticket that has already been validated</li>
                  <li>Not share or transfer your OTP code with others</li>
                  <li>Comply with all transport company policies and regulations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Refunds and Cancellations</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>Refund and cancellation policies:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Refunds are subject to the policies of the individual transport company</li>
                  <li>Refund requests must be made before ticket validation</li>
                  <li>Once a ticket is validated, it cannot be refunded</li>
                  <li>Refunds will be processed through the original payment method (MoniMe)</li>
                  <li>Processing times for refunds may vary</li>
                  <li>Service fees, if applicable, are non-refundable</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Prohibited Activities</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the service for any illegal or unauthorized purpose</li>
                  <li>Attempt to gain unauthorized access to any part of the platform</li>
                  <li>Interfere with or disrupt the service or servers connected to the service</li>
                  <li>Use automated systems to access the service without permission</li>
                  <li>Attempt to manipulate ticket prices or transaction processes</li>
                  <li>Share your account credentials with others</li>
                  <li>Use the service to transmit viruses, malware, or harmful code</li>
                  <li>Impersonate any person or entity or misrepresent your affiliation</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                All content, features, and functionality of Foraypay, including but not limited to text, graphics, logos, icons, 
                images, and software, are the exclusive property of Foraypay and its licensors. The service is protected by copyright, 
                trademark, and other laws. You may not reproduce, distribute, modify, or create derivative works without our express 
                written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers and Limitations of Liability</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>Foraypay is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We disclaim all warranties, 
                express or implied, including but not limited to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Warranties of merchantability, fitness for a particular purpose, and non-infringement</li>
                  <li>Warranties that the service will be uninterrupted, secure, or error-free</li>
                  <li>Warranties regarding the accuracy or reliability of any information obtained through the service</li>
                </ul>
                <p className="mt-4">
                  To the maximum extent permitted by law, Foraypay shall not be liable for any indirect, incidental, special, 
                  consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, 
                  or any loss of data, use, goodwill, or other intangible losses resulting from your use of the service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify, defend, and hold harmless Foraypay, its officers, directors, employees, agents, and affiliates 
                from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys&apos; fees, 
                arising out of or in any way connected with your access to or use of the service, your violation of these Terms, or 
                your violation of any rights of another party.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p>We may terminate or suspend your account and access to the service immediately, without prior notice or liability, 
                for any reason, including if you breach these Terms. Upon termination:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your right to use the service will immediately cease</li>
                  <li>All provisions of these Terms that by their nature should survive termination shall survive</li>
                  <li>You remain responsible for any transactions initiated before termination</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of Sierra Leone, without regard to its 
                conflict of law provisions. Any disputes arising out of or relating to these Terms or the service shall be resolved 
                through good faith negotiations. If such negotiations fail, disputes shall be subject to the exclusive jurisdiction 
                of the courts of Sierra Leone.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 
                30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole 
                discretion. By continuing to access or use our service after any revisions become effective, you agree to be bound by 
                the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@foraypay.com<br />
                  <strong>Address:</strong> Foraypay, Sierra Leone
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

