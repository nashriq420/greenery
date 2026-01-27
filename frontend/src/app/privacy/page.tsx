import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background py-16 px-4 md:px-6">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-4xl font-bold mb-8 text-primary">Privacy Policy</h1>

                <div className="space-y-6 text-foreground/80">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
                        <p>
                            At Greenery, we value your privacy and are committed to protecting your personal information. This Privacy Policy
                            explains how we collect, use, and safeguard your data when you use our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Information We Collect</h2>
                        <p>
                            We collect information that you provide directly to us, such as when you create an account, update your profile,
                            post content, or communicate with us. This may include your name, email address, location data, and any other
                            information you choose to provide.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Information</h2>
                        <p>
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Provide, maintain, and improve our services.</li>
                            <li>Process transactions and send related information.</li>
                            <li>Send you technical notices, updates, security alerts, and support messages.</li>
                            <li>Respond to your comments, questions, and requests.</li>
                            <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Data Sharing</h2>
                        <p>
                            We do not share your personal information with third parties except as described in this policy or with your consent.
                            We may share information with vendors, consultants, and other service providers who need access to such information
                            to carry out work on our behalf.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Data Security</h2>
                        <p>
                            We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access,
                            disclosure, alteration, and destruction. However, no internet transmission is completely secure.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Your Rights</h2>
                        <p>
                            You have the right to access, correct, or delete your personal information. You can manage your information
                            through your account settings. If you need assistance, please contact us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Cookies</h2>
                        <p>
                            We use cookies and similar technologies to collect information about your activity, browser, and device.
                            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. If we make changes, we will notify you by revising the date
                            at the bottom of the policy or by providing additional notice.
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
    );
}
