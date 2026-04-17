import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="grow py-16 px-4 md:px-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-primary">Privacy Policy</h1>

          <div className="space-y-6 text-foreground/80">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              1. Terms
            </h2>
            <p>
             BudPlug (the “Company”) is committed to maintaining strong and reliable privacy  protections for its users. This Privacy Policy (“Privacy Policy”)
             is designed to help you  understand how we collect, use, store, and safeguard the information you provide to us, and to assist you in making 
             informed decisions when using our Services.</p>
              <p>For the purposes of this Agreement, the “Services” refer to the Company’s platform, accessible via BudPlug.com [and/or through our mobile application], 
              which enables users to create accounts, connect, and communicate with others within legally compliant cannabis related communities.</p>
              <p>The terms “we,” “us,” and “our” refer to BudPlug, while “you” refers to you as a user of the Services.</p>
              <p>By accessing or using the Services, and by accepting our Privacy Policy and Terms of Service, you consent to the collection, storage, use, 
                and disclosure of your personal information as described in this Privacy Policy.</p>            
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              2. Information We Collect
            </h2>
            <p>We, BudPlug (the “Company”) collects both Non-Personal Information and Personal  Information to operate and improve the Services. Non-Personal Information refers to data that cannot be used to identify you directly. 
              This may include anonymous usage data, general demographic information, referring and exit  pages, URLs, platform or device types, user preferences, and interaction data such as clicks and activity patterns.</p>
              <p>Personal Information refers to information that can identify you. At minimum, this includes your email address, which is provided during the registration process. 
                Additional information may be collected where voluntarily provided by you.</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Information Collected via Technology</strong>
                <p className="mt-2">
                  To access and activate the Services, you are generally only
                  required to provide your email address. Continued use of the
                  Services does not require additional Personal Information
                  unless you choose to provide it. To enhance performance,
                  security, and user experience, BudPlug automatically collects
                  certain Non-Personal Information when you interact with the
                  Services. This may include:
                </p>
                <ul className="list-disc pl-6 mt-2 mb-4 space-y-1">
                  <li>Referring website addresses (e.g., the URL you came from)</li>
                  <li>Browser type and version</li>
                  <li>Device type and operating system</li>
                  <li>Date and time of access</li>
                  <li>Usage patterns and interaction data</li>
                </ul>
                <p>
                  This information is collected through the use of cookies and
                  similar tracking technologies. Cookies are small text files
                  stored on your device that contain anonymous identifiers and
                  allow us to:
                </p>
                <ul className="list-disc pl-6 mt-2 mb-4 space-y-1">
                  <li>Recognize returning users</li>
                  <li>Store user preferences</li>
                  <li>Improve platform performance and functionality</li>
                  <li>
                    Analyze usage trends on both an individual and aggregated
                    level
                  </li>
                </ul>
                <p>BudPlug may use both:</p>
                <ul className="list-disc pl-6 mt-2 mb-4 space-y-1">
                  <li>
                    Session cookies, which expire when you close your browser;
                    and
                  </li>
                  <li>
                    Persistent cookies, which remain on your device until
                    deleted manually or automatically after a set period.
                  </li>
                </ul>
              </li>

              <li>
                <strong>Information You Provide When Registering</strong>
                <p className="mt-2">
                  In addition to automatically collected data, you may provide
                  information when creating an account on the platform. To
                  register, you will be required to:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Provide a valid email address</li>
                  <li>Create a username and password</li>
                  <li>
                    Any photos, descriptions, or prices you provide for plant
                    listings
                  </li>
                  <li>
                    Details regarding your tier (Free or Pro) and related
                    billing information
                  </li>
                </ul>
              </li>
            </ul>
            By registering for an account, you consent to BudPlug collecting, storing, and using your provided information in accordance with this Privacy Policy
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              3. How We Use Your Information
            </h2>
            <strong>Personal Information</strong>
            <p>Except as otherwise outlined in this Privacy Policy, BudPlug (the “Company”) does not sell, trade, rent, or share your Personal Information with third parties for marketing purposes  without your consent.</p>
            <p>We may share Personal Information with trusted third-party service providers who perform services on our behalf, such as email delivery, hosting, or platform support. These service 
              providers are granted access only to the information necessary to perform their functions and are contractually obligated to use such information solely in accordance with our instructions 
              and this Privacy Policy.</p>
              <p>In general, we use Personal Information—such as your email address—to communicate with you regarding important updates, service-related announcements, security notices, or 
                operational issues related to the platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              4. Non-Personal Information
            </h2>
            <p>
              Non-Personal Information is primarily used to enhance and improve the performance and functionality of the Services, as well as to personalize user experience.
              We may aggregate Non-Personal Information to analyze trends, monitor usage patterns, and improve overall platform efficiency. This aggregated data does not identify individual users.
              BudPlug reserves the right to use, share, or disclose Non-Personal Information with partners, service providers, advertisers, or other third parties at its discretion, provided such  information does not identify individual users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              5. Business Transfers
            </h2>
            <p>
             In the event that BudPlug undergoes a business transaction—such as a merger, acquisition, restructuring, or sale of assets—your Personal Information may be transferred as part of that 
             transaction. By using the Services, you acknowledge and consent to such transfers, and agree that any successor entity may continue to process your Personal Information in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              6. Policy Updates
            </h2>
            <p>
             BudPlug reserves the right to update or modify this Privacy Policy at any time. Any changes will be posted on the Site, and where appropriate, users may be notified of significant updates. We encourage you to review this Privacy Policy periodically to stay informed about how your information is collected, used, and protected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              7. How we protect information
            </h2>
            <strong>Data Security</strong>
            <p>BudPlug (the “Company”) implements reasonable administrative, technical, and physical security measures designed to protect your information from unauthorized access, disclosure, alteration, or destruction.</p>
            <p>Your account is secured by your chosen password, and you are responsible for maintaining the confidentiality of your login credentials. We strongly encourage you to take appropriate precautions, including safeguarding your password and logging out of your account after each session, especially when using shared or public devices.</p>
            <p>The Company utilizes industry-standard security technologies, including encryption, firewalls, and secure socket layer (SSL) protocols, to help protect your data. However, no method of transmission over the internet or electronic storage is completely secure. As such, while we strive to protect your information, we cannot guarantee absolute security.</p>
            <p>By using the Services, you acknowledge and accept the inherent risks associated with data transmission and storage, and agree that BudPlug shall not be held liable for unauthorized access or breaches beyond its reasonable control</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              8. Your rights regarding the use of your personal information
            </h2>
            <p>
              <strong>Marketing Communications & Opt-Out</strong>
              <p>You have the right at any time to opt out of receiving marketing or promotional communications from BudPlug (the “Company”).</p>
              <p>If you receive promotional emails from us, you may unsubscribe by following the instructions provided within each email. You may also manage your communication preferences directly through the “Settings” section of the Site.</p>
              <p>Please note that even if you opt out of marketing communications, BudPlug may continue to send you non-promotional, administrative communications. These may include important service-related messages such as account notifications, security alerts, and updates to our Terms of Service or Privacy Policy.</p>
            </p>
          </section>
                    <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              9. Links to other websites
            </h2>
            <p>
              <strong>Third-Party Websites & Services</strong>
             <p>As part of the Services, BudPlug (the “Company”) may provide links to, integrations with, or compatibility with third-party websites, applications, or services.</p> 
            <p>Please note that the Company is not responsible for the privacy practices, policies, or content of such third-party platforms. This Privacy Policy applies solely to information collected by BudPlug through the Site and Services and does not extend to any external websites or applications.
             If you choose to access or use any third-party services through links or integrations on our platform, your interactions will be governed by the respective privacy policies and terms of those third parties.
             We strongly encourage users to review the privacy policies of any external websites or applications before providing any personal information or engaging with their services.</p> 
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              9. Links to other websites
            </h2>
            <p>
              <strong>Changes to our policy</strong>
              <p>BudPlug (the “Company”) reserves the right to update or modify this Privacy Policy and its Terms of Service at any time.
                Where changes are considered significant, the Company will make reasonable efforts to  notify users, which may include sending a notice to the primary email address associated with your account or displaying a prominent notice on the Site. Such changes will become effective thirty (30) days after notification. Non-material updates, clarifications, or administrative changes will take effect immediately upon posting. We encourage you to review this Privacy Policy periodically to stay informed about how your information is collected, used, and protected.</p>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              10. Contact Us
            </h2>
            <p>
              <strong>Contact Us</strong>
              <p>If you have any questions regarding this Privacy Policy or the practices of the Site, please contact us at: <b>support@budplug.com</b></p>
            </p>
          </section>
          <section className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </section>
        </div>
      </div>
    </div>
    <Footer />
  </main>
);
}
