# Prompt: monthly refresh

---

It's time for this pathway's review. Today is **[DATE]**.

1. Open the Technology register data (`src/content/register.js`) and list the entries due for review by today.
2. For each, check its source and the product's release notes since its `verified` date. Also scan the vendor's
   roadmap and change announcements for the last month for anything that affects a capability, a standard or a
   price on the site, even if its entry isn't due. Report what changed.
3. Update entries: `verified`, and where needed `status`, `version` and `note`. Find every page that cites the changed
   source (`grep -rn "<sourceKey>" src`) and fix those pages too; update their verified dates.
4. Add one line per change to the change log in the README.
5. Build, run the screenshot checks, and open a pull request titled "Refresh: [MONTH YEAR]" with the list of changes.
