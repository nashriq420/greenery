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
                            Greenery is a dedicated plant marketplace connecting sellers and enthusiasts. We value your privacy and are committed to protecting your personal information. This Privacy Policy
                            explains how we collect, use, and safeguard your data when you use our platform to browse, buy, or sell plants.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Information We Collect</h2>
                        <p>
                            We collect information that you provided directly to us:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li><strong>Account Information:</strong> Name, email address, password, and chosen role (Customer or Seller).</li>
                            <li>
                                <strong>Location Data & Maps:</strong> When you use our interactive marketplace map, our site will prompt for your device's geographical location. 
                                By granting access, your real-time location may be used and temporarily displayed on the map to help you find nearby sellers. 
                                For sellers, shop locations will be visibly listed on the map to help customers navigate to your store.
                            </li>
                            <li><strong>Listing Content:</strong> Any photos, descriptions, or prices you provide for plant listings.</li>
                            <li><strong>Subscription Data:</strong> Details regarding your tier (Free or Pro) and related billing information.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Information</h2>
                        <p>
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Enable our core marketplace and radius-based search functionalities.</li>
                            <li>Process subscription upgrades and maintain account security.</li>
                            <li>Send technical notices, updates, and support messages.</li>
                            <li>Respond to your comments, questions, and marketplace inquiries.</li>
                            <li>Monitor and analyze trends to improve the Greenery experience.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Transparency and Sharing</h2>
                        <p>
                            Sellers' location data and shop details are made visible to other users on our platform's maps to facilitate local plant trading. We do not share your private personal information with third parties except as required for service provision (e.g., payment processing) or with your explicit consent.
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
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Cookies and Tracking Technologies</h2>
                        <p>
                            We use cookies and similar technologies to collect information about your activity, browser, and device. This includes storing your preferences, such as your acknowledgement of our cookie and location policies via the consent banner.
                            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent, but this may affect some interactive functionality, such as our location maps.
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
