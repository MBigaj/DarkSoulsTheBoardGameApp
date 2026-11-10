import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { NotFound } from '@/app/NotFound';
import type { KeepFocusState } from '@/app/AppShell';
import { useCatalog } from '@/shared/api/queries';
import type { CardType } from '@/shared/api/types';
import { displayCodes, type NameOf } from '@/shared/lib/format';
import { pickParams, readParams } from '@/shared/lib/url-state';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Tabs } from '@/shared/ui/Tabs';
import { ArchiveToolbar } from './ArchiveToolbar';
import { cardsOfType, overview, PREVIEW, tabCounts } from './catalog';
import { commonFields, rememberFilters, tabSearch, typeFields, type TypeFilters } from './filters';
import { archiveMemory } from './memory';
import { ARCHIVE_TABS, tabForSlug, type ArchiveTab } from './tabs';
import { TypeSection } from './TypeSection';
import { useCommonFilters } from './useArchiveParams';
import styles from './ArchivePage.module.css';

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
  const { params, common, setCommon } = useCommonFilters();
  const { cards, complete, error } = useCatalog(tab?.type);

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

  // The open tab's filters come from the URL, the others' from session memory.
  const filtersOf = <T extends CardType>(type: T): TypeFilters<T> =>
    readParams(typeFields[type], type === tab?.type ? params : archiveMemory.load(type));
  const counts = complete ? tabCounts(cards, common, filtersOf, codes) : undefined;
  const tabCards = tab ? cardsOfType(cards, tab.type, common, filtersOf(tab.type), codes) : [];

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
          {error ? (
            <p className={styles.error}>The archive could not be loaded. Try again later.</p>
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
          ) : (
            overview(cards, common, codes).map((section) => (
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
    </>
  );
}
