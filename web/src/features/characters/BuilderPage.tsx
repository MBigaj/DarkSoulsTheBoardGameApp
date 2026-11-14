import { useMemo } from 'react';
import { useClasses } from '@/shared/api/queries';
import type { ClassDef } from '@/shared/api/types';
import { PageHeader } from '@/shared/ui/PageHeader';
import { soulsSpent, type PartySlot } from './builder/builderReducer';
import { useBuilder } from './builder/useBuilder';
import { ClassCard } from './ClassCard';
import { PartyRoster } from './PartyRoster';
import { StatProgression } from './StatProgression';
import styles from './BuilderPage.module.css';

const PANEL_ID = 'builder-slot-panel';

/** Character Builder (CharactersFinal): party, class card and stat progression. */
export function BuilderPage() {
  const classes = useClasses();
  return (
    <>
      <title>Character Builder · Bonfire Ledger</title>
      <PageHeader
        crumbs={['Compendium', 'Character builder']}
        title="Character Builder"
        lede="Pick a class for each of four slots, buy stat tiers at the bonfire and test an attack option."
      />
      <div className={styles.main} data-loading={classes.isPending || undefined}>
        {classes.data && classes.data.length > 0 ? (
          <Builder classes={classes.data} />
        ) : (
          classes.isError && <p className={styles.note}>The classes couldn't be loaded.</p>
        )}
      </div>
    </>
  );
}

function Builder({ classes }: { classes: readonly ClassDef[] }) {
  const [state, dispatch] = useBuilder();
  const byId = useMemo(() => new Map(classes.map((cls) => [cls._id, cls])), [classes]);
  // A saved class the store no longer has shows as the first class until another is picked.
  const fallback = classes[0] as ClassDef;
  const classOf = (slot: PartySlot) => byId.get(slot.classId) ?? fallback;
  const slot = state.slots[state.active];
  if (!slot) return null;
  const cls = classOf(slot);

  return (
    <>
      <PartyRoster
        slots={state.slots}
        active={state.active}
        classes={classes}
        classOf={classOf}
        onSelectSlot={(index) => {
          dispatch({ type: 'selectSlot', slot: index });
        }}
        onPickClass={(classId) => {
          dispatch({ type: 'setClass', classId });
        }}
        panelId={PANEL_ID}
      />
      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={`party-slot-${String(state.active)}`}
        className={styles.columns}
      >
        <div className={styles.column}>
          <ClassCard cls={cls} souls={soulsSpent(slot.tiers)} stamina={0} />
          <StatProgression
            cls={cls}
            tiers={slot.tiers}
            onSetTier={(stat, tier) => {
              dispatch({ type: 'setTier', stat, tier });
            }}
            onReset={() => {
              dispatch({ type: 'reset' });
            }}
          />
        </div>
      </div>
    </>
  );
}
