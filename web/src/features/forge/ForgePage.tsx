import { useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useEncounter, useGenerateEncounter } from '@/shared/api/queries';
import type { EncounterLevel } from '@/shared/api/types';
import { PageHeader } from '@/shared/ui/PageHeader';
import { controlsReducer, INITIAL_CONTROLS, toRequest } from './controls';
import { ForgeRail } from './ForgeRail';
import styles from './ForgePage.module.css';

const ROMAN: Record<EncounterLevel, string> = { 1: 'I', 2: 'II', 3: 'III' };

/**
 * Encounter Forge (ForgeFinal): the settings rail, and the encounter at /forge/:id. Forging
 * navigates there, so the link always shows what was forged. The result panel (map, legend,
 * roster) comes in FE-20; until then a summary line stands in. Never shows a seed.
 */
export function ForgePage() {
  const { id = null } = useParams();
  const navigate = useNavigate();
  const encounter = useEncounter(id);
  const forge = useGenerateEncounter();
  const [controls, dispatch] = useReducer(controlsReducer, INITIAL_CONTROLS);

  // An encounter opened by link fills the rail with its settings, until the player changes one.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (encounter.data && encounter.data.id !== loadedId) {
    setLoadedId(encounter.data.id);
    dispatch({ type: 'load', encounter: encounter.data });
  }

  const onForge = () => {
    const request = toRequest(controls);
    if (!request) return;
    forge.mutate(request, {
      onSuccess: (made) => {
        // The rail already holds what this was forged with: don't refill it from the result.
        setLoadedId(made.id);
        void navigate(`/forge/${made.id}`);
      },
    });
  };

  const shown = encounter.data;
  const noPool = controls.sets.length === 0;
  return (
    <>
      <title>Encounter Forge · Bonfire Ledger</title>
      <PageHeader
        crumbs={['Compendium', 'Encounter forge']}
        title="Encounter Forge"
        lede="New encounters from every enemy, tile, terrain token and keyword in your pool."
      />
      <div className={styles.main}>
        <ForgeRail
          controls={controls}
          dispatch={dispatch}
          onMode={(mode) => {
            dispatch({ type: 'setMode', mode, shown });
          }}
          onForge={onForge}
          forging={forge.isPending}
          error={forge.isError ? "The encounter couldn't be forged. Try again." : null}
        />
        <section
          aria-label="Generated encounter"
          className={styles.result}
          aria-busy={forge.isPending || encounter.isFetching ? true : undefined}
        >
          {/* Placeholder until FE-20's result panel. */}
          <p role="status" className={styles.note} hidden={!noPool}>
            {noPool && 'Pick at least one core set to forge from.'}
          </p>
          {id === null && !noPool && (
            <p className={styles.note}>Choose a difficulty and forge an encounter.</p>
          )}
          {id !== null && encounter.isError && (
            <p className={styles.note}>This encounter couldn't be found.</p>
          )}
          {shown && (
            <p className={styles.summary}>
              Level {ROMAN[shown.level]} · {shown.tiles.length}{' '}
              {shown.tiles.length === 1 ? 'tile' : 'tiles'} · {shown.partySize}{' '}
              {shown.partySize === 1 ? 'player' : 'players'}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
