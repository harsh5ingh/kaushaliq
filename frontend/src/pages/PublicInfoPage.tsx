import { useLocale } from "../hooks/usePreferences";
export type PublicInfoKind =
  | "about"
  | "contact"
  | "documentation"
  | "privacy"
  | "terms";



export function PublicInfoPage({ kind }: { kind: PublicInfoKind }) {
  const { t } = useLocale();
const content: Record<
  PublicInfoKind,
  {
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  about: {
    eyebrow: t("about.eyebrow"),
    title: t("about.title"),
    description:
      t("about.description"),
  },
  contact: {
    eyebrow: t("contact.eyebrow"),
    title: t("contact.title"),
    description:
      t("contact.description"),
  },
  documentation: {
    eyebrow: t("docs.eyebrow"),
    title: t("docs.title"),
    description:
      t("docs.description"),
  },
  privacy: {
    eyebrow: t("privacy.eyebrow"),
    title: t("privacy.title"),
    description:
      t("privacy.description"),
  },
  terms: {
    eyebrow: t("terms.eyebrow"),
    title: t("terms.title"),
    description:
      t("terms.description"),
  },
};


  const page = content[kind];

  return (
    <section className="public-page">
      <div className="public-page-inner">
        <p className="eyebrow">{page.eyebrow}</p>

        <h1>{page.title}</h1>

        <p className="public-page-lead">{page.description}</p>
      </div>
    </section>
  );
}