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
              Welcome to BudPlug. By accessing our website and using our
              services, you agree to comply with and be bound by the following
              terms and conditions.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              BudPlug is a marketplace platform that facilitates the sale and
              exchange of plants and related information. We do not personally
              sell the items listed on our platform.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                01
              </span>{" "}
              User Accounts
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              To access certain features of BudPlug, you may be required to
              create an account. You are responsible for maintaining the
              confidentiality of your account information and for all activities
              that occur under your account.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                02
              </span>{" "}
              User Content
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Users retain ownership of the content they post on BudPlug,
              including text, images, and other materials. By posting
              content, you grant BudPlug a non-exclusive, worldwide,
              royalty-free license to use, reproduce, and display your content
              in connection with our services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                03
              </span>{" "}
              Prohibited Conduct
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to use BudPlug for any unlawful purpose or in any
              way that violates these Terms. This includes, but is not limited
              to, posting illegal content, harassing other users, or attempting
              to interfere with the operation of the platform.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                04
              </span>{" "}
              Termination
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account and access to BudPlug
              immediately, without prior notice or liability, for any reason
              whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                05
              </span>{" "}
              Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              BudPlug is provided on an "AS IS" and "AS AVAILABLE" basis. We
              make no representations or warranties of any kind, express or
              implied, as to the operation of our services or the information,
              content, materials, or products included on our services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                06
              </span>{" "}
              Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall BudPlug, its directors, employees, or agents,
              be liable for any indirect, incidental, special, consequential, or
              punitive damages arising out of or in connection with your use of
              our services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">
                07
              </span>{" "}
              Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or replace these Terms at any time.
              We will notify you of any major changes by posting the new Terms
              on this page. Your continued use of BudPlug after any such changes
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
