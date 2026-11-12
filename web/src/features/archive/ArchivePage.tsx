import { lazy, Suspense, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { NotFound } from '@/app/NotFound';
import type { KeepFocusState } from '@/app/AppShell';
import { useCatalog, useClasses } from '@/shared/api/queries';
import type { CardType } from '@/shared/api/types';
import { displayCodes, type NameOf } from '@/shared/lib/format';
import { pickParams, readParams } from '@/shared/lib/url-state';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Chip, ChipRow } from '@/shared/ui/Chip';
import { Tabs } from '@/shared/ui/Tabs';
import { ArchiveToolbar } from './ArchiveToolbar';
import {
  availableOptions,
  cardsOfType,
  overview,
  PREVIEW,
  setCounts,
  sortCards,
  tabCounts,
} from './catalog';
import { FilterRail } from './FilterRail';
import { activeChips, railFacets, toggleSet, type DataOptions } from './rail';
import {
  commonFields,
  rememberFilters,
  tabSearch,
  typeFields,
  type CommonFilters,
  type TypeFilters,
} from './filters';
import { CARD_TYPES } from '@/shared/lib/card-types';
import { emptyValues } from '@/shared/lib/url-state';
import { archiveMemory } from './memory';
import { ARCHIVE_TABS, tabForSlug, type ArchiveTab } from './tabs';
import { TypeSection } from './TypeSection';
import { useCommonFilters, type Update } from './useArchiveParams';
import type { CloseUpState } from './CardTile';
import styles from './ArchivePage.module.css';

const CardCloseUp = lazy(() => import('./closeup/CardCloseUp'));

const ALL = 'all';
const KEEP: KeepFocusState = { keepFocus: true };
/** Skeleton tiles on a type page until its first page arrives; cards then take their places. */
const SKELETONS = 10;

const TAB_OF: Record<CardType, ArchiveTab> = Object.fromEntries(
  ARCHIVE_TABS.map((tab) => [tab.type, tab]),
) as Record<CardType, ArchiveTab>;

export function ArchivePage() {
  const { type: slug } = useParams();
  const tab = tabForSlug(slug);
  if (slug !== undefined && !tab) return <NotFound />;
  return <Archive tab={tab} />;
}

function Archive({ tab }: { tab: ArchiveTab | undefined }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { params, common, setCommon, write } = useCommonFilters();
  const { cards, complete, error } = useCatalog(tab?.type);
  const classes = useClasses().data ?? [];

  // Each type tab keeps its own filters for the session.
  const search = params.toString();
  useEffect(() => {
    if (tab) rememberFilters(archiveMemory, tab.type, new URLSearchParams(search));
  }, [tab, search]);

  const codes = useMemo(() => displayCodes(cards), [cards]);
  const nameOf = useMemo<NameOf>(() => {
    const names = new Map(cards.map((card) => [card._id, card.name]));
    return (id) => names.get(id);
  }, [cards]);

  const cardId = params.get('card');
  const cached = useMemo(
    () => (cardId === null ? undefined : cards.find((card) => card._id === cardId)),
    [cards, cardId],
  );

  /** Opened from a tile: Back. Opened from a link: drop `?card=` in place. */
  function closeCard() {
    if ((location.state as CloseUpState | null)?.closeUp) {
      void navigate(-1);
      return;
    }
    const next = new URLSearchParams(params);
    next.delete('card');
    void navigate(
      { search: next.toString() },
      { replace: true, preventScrollReset: true, state: KEEP },
    );
  }

  // The open tab's filters come from the URL, the others' from session memory.
  const filtersOf = <T extends CardType>(type: T): TypeFilters<T> =>
    readParams(typeFields[type], type === tab?.type ? params : archiveMemory.load(type));
  const counts = complete ? tabCounts(cards, common, filtersOf, codes) : undefined;
  const sections = tab ? [] : overview(cards, common, codes);
  const tabCards = tab ? cardsOfType(cards, tab.type, common, filtersOf(tab.type), codes) : [];

  const typeFilters: Record<string, unknown> = tab ? filtersOf(tab.type) : {};
  const setTypeFilters = (update: Update) => {
    if (tab) write(typeFields[tab.type], update);
  };
  const data: DataOptions = {
    classes: classes.map((c) => ({ id: c._id, name: c.name })),
    bosses: sortCards(
      cards.filter((card) => card.type === 'boss'),
      'name',
    ).map((boss) => ({ id: boss._id, name: boss.name })),
  };
  const optionNames = new Map([...data.classes, ...data.bosses].map((o) => [o.id, o.name]));
  const chips = activeChips(common, tab?.type, typeFilters, (id) => optionNames.get(id) ?? id);

  /** Set and search, every type's remembered filters, and the open tab's filters. */
  function clearAll() {
    for (const type of CARD_TYPES) archiveMemory.save(type, new URLSearchParams());
    const cleared: Partial<CommonFilters> = { sets: [], q: '' };
    setCommon(cleared);
    if (tab) write(typeFields[tab.type], emptyValues(typeFields[tab.type]));
  }

  function openTab(id: typeof ALL | CardType) {
    const query =
      id === ALL
        ? pickParams(commonFields, params).toString()
        : tabSearch(archiveMemory, id, params);
    const path = id === ALL ? '/cards' : `/cards/${TAB_OF[id].slug}`;
    void navigate({ pathname: path, search: query }, { state: KEEP });
  }

  const title = tab?.label ?? 'Card Archive';
  return (
    <>
      <title>{`${title} · Bonfire Ledger`}</title>
      <PageHeader
        crumbs={tab ? ['Compendium', 'Card archive', tab.label] : ['Compendium', 'Card archive']}
        title={title}
        lede={
          tab?.blurb ??
          'Every card in the three core sets, grouped by type. Open a type to see all of it with its own filters.'
        }
      />
      <div className={styles.layout}>
        <FilterRail
          tab={tab}
          sets={common.sets}
          setCounts={complete ? setCounts(cards, tab?.type) : undefined}
          onToggleSet={(set) => {
            setCommon((latest) => ({ sets: toggleSet(latest.sets, set) }));
          }}
          typeLinks={ARCHIVE_TABS.map((t) => ({ tab: t, count: counts?.[t.type] }))}
          onOpenType={openTab}
          filters={typeFilters}
          onChange={setTypeFilters}
          data={data}
          available={
            complete && tab
              ? availableOptions(
                  cards,
                  tab.type,
                  common,
                  filtersOf(tab.type),
                  railFacets(tab.type, data),
                  codes,
                )
              : undefined
          }
          onReset={clearAll}
          activeCount={chips.length}
        />
        <section className={styles.results} aria-label="Results" id="archive-results">
          <Tabs
            label="Card type"
            idPrefix="archive-tab"
            panelId="archive-results"
            items={[
              { id: ALL, label: 'All types', count: counts ? counts.all : null },
              ...ARCHIVE_TABS.map((t) => ({
                id: t.type,
                label: t.label,
                count: counts ? counts[t.type] : null,
              })),
            ]}
            selected={tab?.type ?? ALL}
            onSelect={openTab}
          />
          <ArchiveToolbar
            q={common.q}
            sort={common.sort}
            placeholder={tab ? `Search ${tab.lower}` : 'Search every card by name or ID'}
            onChange={setCommon}
          />
          {chips.length > 0 && (
            <ChipRow onClearAll={clearAll}>
              {chips.map((chip) => (
                <Chip
                  key={chip.id}
                  label={chip.label}
                  onRemove={() => {
                    if (chip.clear.common) setCommon(chip.clear.common);
                    if (chip.clear.filters) setTypeFilters(chip.clear.filters);
                  }}
                />
              ))}
            </ChipRow>
          )}
          {error ? (
            <p className={styles.message}>The archive could not be loaded. Try again later.</p>
          ) : tab ? (
            <TypeSection
              tab={tab}
              cards={tabCards}
              total={complete ? counts?.[tab.type] : undefined}
              skeletons={complete ? 0 : Math.max(0, SKELETONS - tabCards.length)}
              codes={codes}
              nameOf={nameOf}
              heading="hidden"
            />
          ) : complete && sections.every((section) => section.total === 0) ? (
            <p className={styles.message}>
              Nothing stirs in the dark. No cards match these filters.
            </p>
          ) : (
            // Once loaded, types with no matches are left out; one empty message covers all.
            sections
              .filter((section) => !complete || section.total > 0)
              .map((section) => (
                <TypeSection
                  key={section.type}
                  tab={TAB_OF[section.type]}
                  cards={section.items}
                  total={complete ? section.total : undefined}
                  skeletons={complete ? 0 : PREVIEW - section.items.length}
                  codes={codes}
                  nameOf={nameOf}
                  viewAll={{
                    pathname: `/cards/${TAB_OF[section.type].slug}`,
                    search: tabSearch(archiveMemory, section.type, params),
                  }}
                  heading="visible"
                />
              ))
          )}
        </section>
      </div>
      {cardId !== null && (
        <Suspense fallback={null}>
          <CardCloseUp
            key={cardId}
            id={cardId}
            cached={cached}
            code={complete ? codes.get(cardId) : undefined}
            nameOf={nameOf}
            onClose={closeCard}
          />
        </Suspense>
      )}
    </>
  );
}
