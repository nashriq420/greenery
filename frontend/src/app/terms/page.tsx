import React from "react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4 md:px-6">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-primary">
          Terms and Conditions
        </h1>

        <div className="space-y-6 text-foreground/80">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              1. Introduction
            </h2>
            <p>
              Welcome to Greenery. By accessing our website and using our
              services, you agree to be bound by these Terms and Conditions.
              Please read them carefully. If you do not agree with any part of
              these terms, you must not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              2. User Accounts
            </h2>
            <p>
              To access certain features of Greenery, you may be required to
              register for an account. You agree to provide accurate, current,
              and complete information during the registration process and to
              update such information to keep it accurate, current, and
              complete. You are responsible for safeguarding your password and
              for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              3. Content Ownership and Use
            </h2>
            <p>
              Users retain ownership of the content they post on Greenery,
              including listings, comments, and images. However, by posting
              content, you grant Greenery a non-exclusive, worldwide,
              royalty-free license to use, reproduce, modify, and display such
              content in connection with the operation of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              4. Prohibited Activities
            </h2>
            <p>
              You agree not to engage in any of the following prohibited
              activities:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Violating any applicable laws or regulations.</li>
              <li>Posting false, misleading, or fraudulent content.</li>
              <li>Harassing, abusing, or harming another person.</li>
              <li>
                Interfering with the security or proper functioning of the
                platform.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              5. Termination
            </h2>
            <p>
              We may terminate or suspend your account and access to Greenery
              immediately, without prior notice or liability, for any reason
              whatsoever, including without limitation if you breach the Terms
              and Conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              6. Disclaimer
            </h2>
            <p>
              Greenery is provided on an "AS IS" and "AS AVAILABLE" basis. We
              make no warranties, expressed or implied, regarding the operation
              of the platform or the information, content, or materials included
              on it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              7. Limitation of Liability
            </h2>
            <p>
              In no event shall Greenery, its directors, employees, or agents,
              be liable for any direct, indirect, incidental, special, or
              consequential damages resulting from your use of or inability to
              use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              8. Changes to Terms
            </h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace
              these Terms at any time. We will provide notice of any significant
              changes. Your continued use of Greenery after any such changes
              constitutes your acceptance of the new Terms.
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
