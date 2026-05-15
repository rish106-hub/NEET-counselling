-- Seed official NTA appeared-candidate counts from published press releases.
-- These are "Number of Candidates Present" (appeared, not registered).
-- Source: NTA NEET UG Results Press Releases 2019–2024
-- https://exams.nta.ac.in/NEET/images/press-release-...

INSERT INTO neet_year_stats (data_year, total_candidates, source_description)
VALUES
  (2019, 1410755, 'NTA NEET UG 2019 Press Release — appeared candidates'),
  (2020, 1366945, 'NTA NEET UG 2020 Press Release — appeared candidates'),
  (2021, 1544273, 'NTA NEET UG 2021 Press Release — appeared candidates'),
  (2022, 1764571, 'NTA NEET UG 2022 Press Release — appeared candidates'),
  (2023, 2038596, 'NTA NEET UG 2023 Press Release — appeared candidates'),
  (2024, 2333297, 'NTA NEET UG 2024 Press Release — appeared candidates')
ON CONFLICT (data_year) DO UPDATE
  SET total_candidates  = EXCLUDED.total_candidates,
      source_description = EXCLUDED.source_description,
      updated_at         = NOW();
