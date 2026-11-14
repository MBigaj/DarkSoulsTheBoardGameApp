import { useEffect, useMemo } from 'react';
import { useClasses } from '@/shared/api/queries';
import type { ClassDef } from '@/shared/api/types';
import { PageHeader } from '@/shared/ui/PageHeader';
import { soulsSpent } from './builder/builderReducer';
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
  // A saved party can name a class the store no longer has: repair the state, not just the view.
  useEffect(() => {
    dispatch({ type: 'syncClasses', ids: classes.map((cls) => cls._id) });
  }, [classes, dispatch]);

  // Until that repair lands (one render), nothing renders for a party with an unknown class.
  const slotClasses = state.slots.flatMap((slot) => byId.get(slot.classId) ?? []);
  const slot = state.slots[state.active];
  const cls = slotClasses[state.active];
  if (slotClasses.length !== state.slots.length || !slot || !cls) return null;

  return (
    <>
      <PartyRoster
        active={state.active}
        classes={classes}
        slotClasses={slotClasses}
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
