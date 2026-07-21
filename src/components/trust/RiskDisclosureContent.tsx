import { COMPANY } from "@/lib/company";

/** Enhanced risk disclosure content — balanced, non-promotional language. */
export function RiskDisclosureContent() {
  return (
    <>
      <h2>Important notice</h2>
      <p>
        Participation in {COMPANY.brand} cooperative products involves financial risk. You should read this disclosure
        carefully and only commit funds you can afford to lose without affecting your essential living expenses.
      </p>

      <h2>Investment risk</h2>
      <p>
        All cooperative investments carry the risk of partial or total loss of capital. Returns depend on verified pool
        performance, member participation levels, and operational conditions — not on fixed interest rates or guaranteed
        schedules.
      </p>

      <h2>Market uncertainty</h2>
      <p>
        Economic conditions, sector performance, currency movement, and liquidity in Nigerian and international markets
        can affect cooperative outcomes. Past performance shown on the platform is not a reliable indicator of future
        results.
      </p>

      <h2>Responsible investing</h2>
      <p>
        Invest only what you can afford to set aside for the published cycle length. Diversify your personal finances
        and seek independent professional advice if you are uncertain about suitability.
      </p>

      <h2>Platform responsibilities</h2>
      <ul>
        <li>Operate transparent processes for deposits, allocations, and settlements</li>
        <li>Verify funding before crediting wallets</li>
        <li>Communicate material operational or security incidents without undue delay</li>
        <li>Maintain audit trails for sensitive account and wallet actions</li>
      </ul>

      <h2>Member responsibilities</h2>
      <ul>
        <li>Provide accurate identity and bank details</li>
        <li>Protect login credentials and review account activity regularly</li>
        <li>Report suspicious messages or unauthorised access immediately</li>
        <li>Read product terms and cycle timelines before committing funds</li>
      </ul>

      <h2>Security expectations</h2>
      <p>
        {COMPANY.brand} uses encryption, access controls, and monitoring appropriate to a member financial platform.
        No online system is completely immune to fraud or disruption. You share responsibility for securing your devices
        and recognising phishing attempts.
      </p>

      <h2>Fraud awareness</h2>
      <p>
        Fraudsters may impersonate staff, promise guaranteed returns, or request passwords and PINs. {COMPANY.brand}{" "}
        will never ask for your password or PIN by phone, email, or social media. Verify communications through official
        channels only.
      </p>

      <h2>No guaranteed returns</h2>
      <p>
        Projected daily figures, cycle totals, and bonus amounts displayed on the platform are cooperative estimates
        based on documented pool performance. They are not promises, guarantees, or fixed interest rates.
      </p>

      <h2>Not a bank deposit</h2>
      <p>
        Funds placed in {COMPANY.brand} products are not bank deposits and are not protected by the Nigeria Deposit
        Insurance Corporation (NDIC) or the UK Financial Services Compensation Scheme (FSCS).
      </p>

      <h2>Liquidity risk</h2>
      <p>
        Many products have defined cycle lengths and settlement windows. Early withdrawal may not be available, or may
        attract fees or reduced benefits.
      </p>

      <h2>Operational risk</h2>
      <p>
        Platform availability, bank transfer delays, verification backlogs, and third-party service interruptions may
        affect deposit crediting and withdrawal processing times.
      </p>

      <h2>Regulatory risk</h2>
      <p>
        Changes in Nigerian or UK financial regulation may affect product availability, member eligibility, or
        operational procedures.
      </p>

      <h2>Questions</h2>
      <p>
        Contact {COMPANY.supportEmail} before committing funds if anything in this disclosure is unclear.
      </p>
    </>
  );
}
