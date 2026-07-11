import Link from "next/link";
import { ArrowRight, CheckCircle2, Monitor, Smartphone, Tablet } from "lucide-react";
import { DownloadAppButton } from "@/components/pwa/DownloadAppButton";
import { PageHero } from "@/components/marketing/PageHero";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  APP_VERSION,
  downloadBenefits,
  downloadFaqs,
  downloadMeta,
  installGuides,
  installOptions,
  releaseNotes
} from "@/content/download";
import { COMPANY } from "@/lib/company";
import { PWA } from "@/lib/pwa/config";

export function DownloadPageContent() {
  return (
    <div className="bg-[var(--surface)]">
      <section className="gradient-hero section-pad">
        <div className="container-ar grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Badge variant="emerald">Mobile & desktop</Badge>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--heading)] sm:text-5xl">Download AltoRich</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--text-muted)]">{downloadMeta.description}</p>
            <p className="mt-2 text-sm text-[var(--text-subtle)]">Version {APP_VERSION} · {downloadMeta.requirements}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <DownloadAppButton variant="primary" size="lg" label="Install App" />
              <Link href="/auth/login">
                <Button variant="outline" size="lg">
                  Sign in <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
          <Card variant="elevated" padding="lg" className="space-y-4">
            <p className="text-sm font-semibold text-[var(--heading)]">Why install?</p>
            <ul className="space-y-3">
              {downloadBenefits.map((item) => (
                <li key={item.title} className="flex gap-3 text-sm text-[var(--text-muted)]">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--emerald)]" size={18} aria-hidden />
                  <span>
                    <strong className="text-[var(--heading)]">{item.title}.</strong> {item.description}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="section-pad bg-section">
        <div className="container-ar">
          <PageHero eyebrow="Install" title="Choose your platform" description="Every option uses the same secure AltoRich platform." />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {installOptions.map((option) => (
              <Card key={option.id} variant="elevated" padding="md" className="flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-[var(--heading)]">{option.title}</h3>
                  {option.status === "coming-soon" ? <Badge variant="gold">Coming soon</Badge> : null}
                  {option.status === "optional" ? <Badge variant="outline">Testing</Badge> : null}
                </div>
                <p className="mt-2 flex-1 text-sm text-[var(--text-muted)]">{option.description}</p>
                <div className="mt-4">
                  {option.id === "android-pwa" || option.id === "desktop" ? (
                    <DownloadAppButton variant="outline" size="sm" label={option.cta} />
                  ) : option.id === "android-apk" ? (
                    <a href="#build-guide">
                      <Button variant="outline" size="sm">
                        {option.cta}
                      </Button>
                    </a>
                  ) : (
                    <a href="#ios-guide">
                      <Button variant="outline" size="sm">
                        {option.cta}
                      </Button>
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-ar grid gap-8 lg:grid-cols-3">
          <Card variant="elevated" padding="md" id="android-guide">
            <div className="mb-3 flex items-center gap-2 text-[var(--emerald)]">
              <Smartphone size={18} aria-hidden />
              <h3 className="font-semibold text-[var(--heading)]">Android</h3>
            </div>
            <ol className="space-y-4">
              {installGuides.android.map((step) => (
                <li key={step.step}>
                  <p className="text-sm font-semibold text-[var(--heading)]">
                    {step.step}. {step.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{step.body}</p>
                </li>
              ))}
            </ol>
          </Card>
          <Card variant="elevated" padding="md">
            <div className="mb-3 flex items-center gap-2 text-[var(--emerald)]">
              <Monitor size={18} aria-hidden />
              <h3 className="font-semibold text-[var(--heading)]">Desktop</h3>
            </div>
            <ol className="space-y-4">
              {installGuides.desktop.map((step) => (
                <li key={step.step}>
                  <p className="text-sm font-semibold text-[var(--heading)]">
                    {step.step}. {step.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{step.body}</p>
                </li>
              ))}
            </ol>
          </Card>
          <Card variant="elevated" padding="md" id="ios-guide">
            <div className="mb-3 flex items-center gap-2 text-[var(--emerald)]">
              <Tablet size={18} aria-hidden />
              <h3 className="font-semibold text-[var(--heading)]">iPhone / iPad</h3>
            </div>
            <ol className="space-y-4">
              {installGuides.iphone.map((step) => (
                <li key={step.step}>
                  <p className="text-sm font-semibold text-[var(--heading)]">
                    {step.step}. {step.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{step.body}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </section>

      <section className="section-pad bg-[var(--gray-50)]">
        <div className="container-ar grid gap-8 lg:grid-cols-2">
          <Card variant="elevated" padding="md">
            <h3 className="text-lg font-semibold text-[var(--heading)]">Release notes · v{APP_VERSION}</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
              {releaseNotes.map((note) => (
                <li key={note} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--emerald)]" size={16} aria-hidden />
                  {note}
                </li>
              ))}
            </ul>
          </Card>
          <Card variant="elevated" padding="md" id="build-guide">
            <h3 className="text-lg font-semibold text-[var(--heading)]">Google Play & APK build</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              The Trusted Web Activity project lives in <code className="text-xs">android/</code> in the repository. Build scripts produce a testing APK and release AAB once signing keys are configured.
            </p>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Digital Asset Links must be verified at{" "}
              <a className="text-[var(--emerald)] underline" href={`${COMPANY.siteUrl}/.well-known/assetlinks.json`}>
                /.well-known/assetlinks.json
              </a>{" "}
              before Play Store submission.
            </p>
            <p className="mt-3 text-xs text-[var(--text-subtle)]">Start URL: {PWA.startUrl} · Scope: {PWA.scope}</p>
          </Card>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-ar max-w-3xl">
          <PageHero eyebrow="FAQ" title="Installation questions" align="center" className="mx-auto" />
          <div className="mt-8 space-y-4">
            {downloadFaqs.map((item) => (
              <Card key={item.q} variant="outline" padding="md">
                <h3 className="font-semibold text-[var(--heading)]">{item.q}</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{item.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
