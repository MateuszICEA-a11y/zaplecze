from main import body_completeness_problems

FMT = {"short_min_words": 400}
FULL = "## Nagłówek\n\n" + ("Pełne zdanie o modelach. " * 300) + "\n\n## W skrócie\n\n- Punkt pierwszy.\n- Punkt drugi.\n"


def test_full_body_passes():
    assert body_completeness_problems(FULL, FMT) == []


def test_truncated_body_is_flagged():
    problems = body_completeness_problems("## Nagłówek\n\nNowe wydanie wiąże", FMT)
    assert len(problems) == 3
