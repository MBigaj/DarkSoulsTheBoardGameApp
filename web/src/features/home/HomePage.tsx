import { Link } from 'react-router';
import { ArtSlot } from '@/shared/ui/ArtSlot';
import { ButtonLink } from '@/shared/ui/Button';
import { Eyebrow } from '@/shared/ui/Eyebrow';
import { LATER, SETS, TOOLS } from './content';
import { ToolIcon } from './ToolIcon';
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
          <ArtSlot
            className={styles.keyArt}
            label="Key art"
            note="[Licensed box art, supplied by owner]"
            ratio="16 / 7"
            framed
            glow
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="tools-title">
        <div className={styles.headingCentred}>
          <Eyebrow>Tools</Eyebrow>
          <h2 id="tools-title" className={styles.h2}>
            The three pillars
          </h2>
        </div>
        <ul className={styles.grid}>
          {TOOLS.map((tool) => (
            <li key={tool.to}>
              <Link to={tool.to} className={styles.tool}>
                <span className={styles.toolIcon}>
                  <ToolIcon icon={tool.icon} />
                </span>
                <span className={styles.toolTitle}>{tool.title}</span>
                <span className={styles.toolLine}>{tool.line}</span>
                <span className={styles.cta}>
                  {tool.cta} <span aria-hidden="true">→</span>
                </span>
              </Link>
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
            <li key={set.short}>
              <Link to="/cards" className={styles.setCard}>
                <span className={styles.setHead}>
                  <span>Core set</span>
                  <span className={styles.setShort}>{set.short}</span>
                </span>
                <ArtSlot label="Box art" ratio="4 / 5" framed />
                <span className={styles.setText}>
                  <span className={styles.setName}>{set.name}</span>
                  <span className={styles.setLine}>{set.line}</span>
                </span>
                <span className={styles.counts}>
                  {set.counts.map(([label, value]) => (
                    <span key={label} className={styles.count}>
                      <span className={styles.countLabel}>{label}</span>
                      <span>{value}</span>
                    </span>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
