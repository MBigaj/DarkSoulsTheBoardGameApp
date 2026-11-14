import { useEffect, useMemo, useState } from 'react';
import { useCatalog, useClasses } from '@/shared/api/queries';
import type { ClassDef, Treasure } from '@/shared/api/types';
import { PageHeader } from '@/shared/ui/PageHeader';
import { soulsSpent } from './builder/builderReducer';
import {
  cardIn,
  cardsLost,
  equip,
  freeUpgradeSlots,
  starterKit,
  upgradeCost,
  type Gear,
  type GearSlot,
} from './builder/gear';
import { CardChooser } from './CardChooser';
import { UpgradeDetails } from './UpgradeDetails';
import { Equipment } from './Equipment';
import { useBuilder } from './builder/useBuilder';
import { ClassCard } from './ClassCard';
import { PartyRoster } from './PartyRoster';
import { StatProgression } from './StatProgression';
import styles from './BuilderPage.module.css';

const PANEL_ID = 'builder-slot-panel';

/**
 * After an upgrade comes off, its row (and the button that had focus) is gone: focus the card's
 * first upgrade control instead, once React has drawn the change.
 */
function focusUpgradesOf(hostId: string) {
  requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>(`[data-upgrades-of="${CSS.escape(hostId)}"] button`)
      ?.focus();
  });
}

/** Character Builder (CharactersFinal): party, class card, stat progression and equipment. */
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

  // Treasure from the catalog (complete = every card): starter kits, the chooser, card faces.
  const catalog = useCatalog('treasure');
  const treasure = useMemo(
    () =>
      catalog.complete
        ? catalog.cards.filter((card): card is Treasure => card.type === 'treasure')
        : [],
    [catalog.cards, catalog.complete],
  );
  const cardById = useMemo(() => new Map(treasure.map((card) => [card._id, card])), [treasure]);
  const kits = useMemo(
    (): Record<string, Gear> | null =>
      treasure.length === 0
        ? null
        : Object.fromEntries(classes.map((c) => [c._id, starterKit(c._id, treasure)])),
    [classes, treasure],
  );
  // Slots without gear get their starter kit; saved cards the catalog lost are dropped.
  useEffect(() => {
    if (kits) dispatch({ type: 'fillGear', kits, known: new Set(cardById.keys()) });
  }, [kits, cardById, dispatch]);

  // Slots each upgrade card takes, for the reducer's free-slot check.
  const costs = useMemo(
    () =>
      Object.fromEntries(
        treasure.filter((card) => card.equip === 'upgrade').map((c) => [c._id, upgradeCost(c)]),
      ),
    [treasure],
  );

  /** The open dialog: a card for a slot, an upgrade for a card, or an upgrade's details. */
  /** What the last equip dropped, for the active slot; shown until dismissed or the slot changes. */
  const [notice, setNotice] = useState<{ slot: number; text: string } | null>(null);

  const [choosing, setChoosing] = useState<
    | { kind: 'slot'; slot: GearSlot }
    | { kind: 'upgrade'; hostId: string }
    | { kind: 'details'; hostId: string; upgradeId: string }
    | null
  >(null);

  const dialogHost =
    choosing && choosing.kind !== 'slot' ? cardById.get(choosing.hostId) : undefined;
  const dialogUpgrade = choosing?.kind === 'details' ? cardById.get(choosing.upgradeId) : undefined;

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
          dispatch({ type: 'setClass', classId, kit: kits?.[classId] ?? null });
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
          <Equipment
            gear={slot.gear}
            cardOf={(id) => cardById.get(id)}
            onChoose={(gearSlot) => {
              setChoosing({ kind: 'slot', slot: gearSlot });
            }}
            onAddUpgrade={(host) => {
              setChoosing({ kind: 'upgrade', hostId: host._id });
            }}
            onInspectUpgrade={(host, upgrade) => {
              setChoosing({ kind: 'details', hostId: host._id, upgradeId: upgrade._id });
            }}
            notice={notice?.slot === state.active ? notice.text : null}
            onDismissNotice={() => {
              setNotice(null);
            }}
            onRemoveUpgrade={(host, upgrade) => {
              dispatch({ type: 'detachUpgrade', hostId: host._id, upgradeId: upgrade._id });
              focusUpgradesOf(host._id);
            }}
            onTwoHanded={(on) => {
              dispatch({ type: 'setTwoHanded', on });
            }}
          />
        </div>
      </div>
      {choosing?.kind === 'slot' && slot.gear && (
        <CardChooser
          mode={{ kind: 'slot', slot: choosing.slot, current: cardIn(slot.gear, choosing.slot) }}
          classId={cls._id}
          className={cls.name}
          treasure={treasure}
          onPick={(card) => {
            if (slot.gear) {
              // A two-handed card with both backups full drops the left-hand card: say so.
              const gear = slot.gear;
              const lost = cardsLost(
                gear,
                equip(gear, choosing.slot, card),
                cardIn(gear, choosing.slot),
              ).flatMap((id) => cardById.get(id) ?? []);
              const withUpgrades = lost.some((c) => (gear.upgrades[c._id]?.length ?? 0) > 0);
              setNotice(
                lost.length > 0
                  ? {
                      slot: state.active,
                      text: `${lost.map((c) => c.name).join(', ')} came off${
                        withUpgrades ? ', with its upgrades' : ''
                      }: both backup slots were full.`,
                    }
                  : null,
              );
            }
            dispatch({ type: 'equip', slot: choosing.slot, card });
            setChoosing(null);
          }}
          onClose={() => {
            setChoosing(null);
          }}
        />
      )}
      {choosing?.kind === 'upgrade' && slot.gear && dialogHost && (
        <UpgradeChooser
          gear={slot.gear}
          host={dialogHost}
          costs={costs}
          classId={cls._id}
          className={cls.name}
          treasure={treasure}
          onPick={(upgrade, host) => {
            dispatch({ type: 'attachUpgrade', host, upgrade, costs });
            setChoosing(null);
          }}
          onClose={() => {
            setChoosing(null);
          }}
        />
      )}
      {choosing?.kind === 'details' && dialogHost && dialogUpgrade && (
        <UpgradeDetails
          host={dialogHost}
          upgrade={dialogUpgrade}
          onRemove={() => {
            dispatch({
              type: 'detachUpgrade',
              hostId: choosing.hostId,
              upgradeId: choosing.upgradeId,
            });
            setChoosing(null);
            focusUpgradesOf(choosing.hostId);
          }}
          onClose={() => {
            setChoosing(null);
          }}
        />
      )}
    </>
  );
}

type UpgradeChooserProps = {
  gear: Gear;
  host: Treasure;
  costs: Readonly<Record<string, number>>;
  classId: string;
  className: string;
  treasure: readonly Treasure[];
  onPick: (upgrade: Treasure, host: Treasure) => void;
  onClose: () => void;
};

/** The chooser in upgrade mode for one card of the gear. */
function UpgradeChooser({ gear, host, costs, onPick, ...rest }: UpgradeChooserProps) {
  const attached = gear.upgrades[host._id] ?? [];
  const free = freeUpgradeSlots(gear, host, (id) => costs[id] ?? 1);
  return (
    <CardChooser
      {...rest}
      mode={{ kind: 'upgrade', host, free, attached }}
      onPick={(upgrade) => {
        if (upgrade) onPick(upgrade, host);
      }}
    />
  );
}
