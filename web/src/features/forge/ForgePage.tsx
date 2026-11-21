import { useReducer, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useEncounter, useGenerateEncounter } from '@/shared/api/queries';
import { PageHeader } from '@/shared/ui/PageHeader';
import { EncounterResult } from './EncounterResult';
import { controlsReducer, INITIAL_CONTROLS, toRequest } from './controls';
import { ForgeRail } from './ForgeRail';
import styles from './ForgePage.module.css';

/**
 * Encounter Forge (ForgeFinal): the settings rail, and the encounter at /forge/:id. Forging
 * navigates there, so the link always shows what was forged; `EncounterResult` draws it. Never
 * shows a seed.
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
          <p role="status" className={styles.notice} hidden={!noPool}>
            {noPool && 'Pick at least one core set to forge from.'}
          </p>
          {shown ? (
            <EncounterResult encounter={shown} />
          ) : (
            <div className={styles.empty}>
              {id === null && <p>Choose a difficulty and forge an encounter.</p>}
              {id !== null && encounter.isError && <p>This encounter couldn&apos;t be found.</p>}
              {id !== null && encounter.isPending && <p>Loading the encounter…</p>}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
