import { Link } from 'react-router';
import { ButtonLink } from '@/shared/ui/Button';
import { Eyebrow } from '@/shared/ui/Eyebrow';
import { LATER, SETS, TOOLS, type CoreSet } from './content';
import { HeroArt } from './HeroArt';
import { ToolIcon } from './ToolIcon';
import { Frame } from '@/shared/ui/Frame';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <>
      <title>Bonfire Ledger</title>

      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroInner}>
          <span className={styles.divider} aria-hidden="true">
            <span />
            <span className={styles.diamond} />
            <span />
          </span>
          <h1 id="home-title" className={styles.title}>
            Rest at the bonfire.
            <br />
            Plan the descent.
          </h1>
          <p className={styles.lede}>
            Every card, class and encounter from the three core sets, kept in one ledger.
          </p>
          <div className={styles.actions}>
            <ButtonLink to="/cards">Open the archive</ButtonLink>
            <ButtonLink to="/forge" variant="ghost">
              Forge an encounter
            </ButtonLink>
          </div>
          <HeroArt className={styles.keyArt} />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="tools-title">
        <div className={styles.headingCentred}>
          <Eyebrow>Tools</Eyebrow>
          <h2 id="tools-title" className={styles.h2}>
            The three pillars
          </h2>
        </div>
        {/* Cards use a stretched link: the title is the link (its name matches what's on screen),
            and its ::after covers the card so the whole card is clickable. */}
        <ul className={styles.grid}>
          {TOOLS.map((tool) => (
            <li key={tool.to} className={styles.tool}>
              <span className={styles.toolIcon}>
                <ToolIcon icon={tool.icon} />
              </span>
              <h3 className={styles.toolTitle}>
                <Link to={tool.to} className={styles.stretched}>
                  {tool.title}
                </Link>
              </h3>
              <p className={styles.toolLine}>{tool.line}</p>
              <span className={styles.cta} aria-hidden="true">
                {tool.cta} →
              </span>
            </li>
          ))}
        </ul>
        {/* Navbar "Campaign" links here (/#later). */}
        <p id="later" className={styles.later}>
          Later · {LATER.join(' · ')}
        </p>
      </section>

      <section className={styles.section} aria-labelledby="sets-title">
        <div className={styles.headingRow}>
          <div className={styles.headingStack}>
            <Eyebrow>Core sets</Eyebrow>
            <h2 id="sets-title" className={styles.h2}>
              Three boxes, one rulebook
            </h2>
          </div>
          <p className={styles.note}>Sunless City rules apply to every set.</p>
        </div>
        <ul className={styles.grid}>
          {SETS.map((set) => (
            <li key={set.short} className={styles.setCard}>
              <span className={styles.setHead}>
                <span>Core set</span>
                <span className={styles.setShort}>{set.short}</span>
              </span>
              <SetArt set={set} />
              <div className={styles.setText}>
                <h3 className={styles.setName}>
                  <Link to="/cards" className={styles.stretched}>
                    {set.name}
                  </Link>
                </h3>
                <p className={styles.setLine}>{set.line}</p>
              </div>
              <dl className={styles.counts}>
                {set.counts.map(([label, value]) => (
                  <div key={label} className={styles.count}>
                    <dt className={styles.countLabel}>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/** A set's art slot: one of its tiles, dimmed, with its main boss card in front. */
function SetArt({ set }: { set: CoreSet }) {
  return (
    <Frame className={styles.setArt}>
      <img
        className={styles.setTile}
        src={set.tile}
        alt=""
        width={720}
        height={720}
        loading="lazy"
        decoding="async"
      />
      <span className={styles.setShade} />
      <img
        className={styles.setBoss}
        src={set.boss}
        alt={`${set.bossName} boss card`}
        width={560}
        height={779}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </Frame>
  );
}
