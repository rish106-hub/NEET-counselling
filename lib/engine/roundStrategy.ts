import type { RoundStrategy } from "@/lib/types";

const FREEZE_FLOAT_EXPLANATION = `When you get a seat in Round 1 or Round 2, you choose one of three options:

- Freeze: You accept this seat permanently. You will NOT be considered for any better seat in future rounds. Choose this if you are happy with the seat.

- Float: You keep this seat but are also considered for a better seat in the next round. If a better seat is available, you automatically get it. If not, you keep your current seat. You lose nothing by choosing Float - it is usually the safest option.

- Slide (Upgrade): You want to stay at the same college but move to a better branch. Not usually relevant for MBBS.

When in doubt: choose Float in Round 1, then reassess in Round 2.`;

interface ScoreBandStrategy {
  min: number;
  max: number;
  strategy: RoundStrategy;
}

const STRATEGIES: ScoreBandStrategy[] = [
  {
    min: 620,
    max: 720,
    strategy: {
      score_band: "620-720 (Top tier)",
      strategy:
        "You are in strong contention for AIIMS, JIPMER, and top government colleges. Round 1 will almost certainly give you a top-tier seat. Float in Round 1 to leave the door open for an even better seat in Round 2 (rare at this score, but possible). Lock (Freeze) in Round 2 if you have a top-5 college.",
      lock_guidance:
        "Freeze in Round 2 if you have AIIMS Delhi, AIIMS Mumbai, MAMC Delhi, VMMC Delhi, or JIPMER. These rarely improve in Mop-up.",
      float_guidance:
        "Float in Round 1. You may not see a better option in Round 2 at this score, but there is no risk to floating.",
      mopup_guidance:
        "Mop-up at this score range is unlikely to offer better seats - vacancies are usually from students who dropped to private. You can participate but not worth sacrificing a top Round 2 seat for.",
      risk_level: "low",
      freeze_float_slide_explanation: FREEZE_FLOAT_EXPLANATION,
    },
  },
  {
    min: 560,
    max: 619,
    strategy: {
      score_band: "560-619 (Strong government range)",
      strategy:
        "Strong government college territory. Round 1 will likely give you a good state government or central institution seat. Float in Round 1 - you have a real chance of upgrading to a better college in Round 2 as students with 620+ scores lock top seats and release mid-tier seats. Evaluate carefully before locking in Round 2.",
      lock_guidance:
        "Freeze in Round 2 if you have secured a college in your preferred state or a centrally-funded institution (AIIMS, JIPMER equivalent). Don't hold out for Mop-up at this score - you risk losing a solid seat.",
      float_guidance:
        "Float in Round 1 and watch closely. Many students at 580-610 see meaningful upgrades from Round 1 to Round 2. Compare your Round 2 options carefully before deciding.",
      mopup_guidance:
        "Participate in Mop-up only if Round 2 gave you a college you are not happy with. Mop-up seats at this score range can be limited and in less-preferred states.",
      risk_level: "low",
      freeze_float_slide_explanation: FREEZE_FLOAT_EXPLANATION,
    },
  },
  {
    min: 480,
    max: 559,
    strategy: {
      score_band: "480-559 (Government college range)",
      strategy:
        "You are in government college range in most states, but competition is high. Round 1 may give you a government seat in a less-preferred location. Float in Round 1 - Round 2 frequently sees good upgrades in this range as students from higher bands finalize their choices. Do not rush to lock.",
      lock_guidance:
        "Consider locking in Round 2 only if you have a government seat in your home state or a college you are genuinely happy attending. Waiting for Mop-up at this score band is risky - Mop-up seats may be in distant states or less-known colleges.",
      float_guidance:
        "Float aggressively in Round 1. This score band sees the highest variance between rounds. Many students gain a significantly better college by floating into Round 2.",
      mopup_guidance:
        "At this score band, Mop-up can sometimes yield a government seat that Round 2 missed. Participate if you did not get a government seat in Round 2. But have a backup plan.",
      risk_level: "medium",
      freeze_float_slide_explanation: FREEZE_FLOAT_EXPLANATION,
    },
  },
  {
    min: 380,
    max: 479,
    strategy: {
      score_band: "380-479 (State government / private border)",
      strategy:
        "You may be on the border between state government seats (particularly in less competitive states) and private college territory. Round 1 results will clarify your options. If you receive a government seat in any round - evaluate it seriously. Government seats at any college are preferable to most private options on a value basis.",
      lock_guidance:
        "If Round 2 gives you any government seat - even in a state you did not prefer - seriously consider locking it. The difference between a government seat (INR 10,000-INR 20,000/year) and a private seat (INR 5-25 lakh/year) is enormous. Do not sacrifice a government seat hoping for a better-located government seat in Mop-up unless you have strong reason.",
      float_guidance:
        "Float in Round 1 if your Round 1 seat is a private college or a government college far from your preference. In Round 2, compare carefully.",
      mopup_guidance:
        "Mop-up at this score range often has remaining government seats in less-served states. Worth participating if you are still without a government seat after Round 2.",
      risk_level: "high",
      freeze_float_slide_explanation: FREEZE_FLOAT_EXPLANATION,
    },
  },
  {
    min: 0,
    max: 379,
    strategy: {
      score_band: "Below 380 (Limited government options)",
      strategy:
        "Government MBBS seats are unlikely at this score for General/OBC candidates (SC/ST/EWS candidates: check category-specific cutoffs - you may still qualify for government seats). Options to evaluate honestly: BAMS/BHMS seats (available via NEET score), BDS seats, private MBBS (significant cost), or dropping and re-attempting. Do not pay management quota fees without careful research.",
      lock_guidance:
        "If any government seat is offered - in any round - seriously consider it. At this score, government seats are rare and should not be passed up without clear reason.",
      float_guidance:
        "Float in every round to maximize your chance of finding a government seat before the cycle ends.",
      mopup_guidance:
        "Stray Vacancy round is worth checking - occasionally government seats in Mop-up and Stray Vacancy go to students at this score band due to overall low participation from higher scorers.",
      risk_level: "high",
      freeze_float_slide_explanation: FREEZE_FLOAT_EXPLANATION,
    },
  },
];

export function getRoundStrategy(score: number): RoundStrategy {
  const match = STRATEGIES.find((s) => score >= s.min && score <= s.max);
  return match?.strategy ?? STRATEGIES[STRATEGIES.length - 1].strategy;
}
