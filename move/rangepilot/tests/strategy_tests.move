#[test_only]
module rangepilot::strategy_tests;

use rangepilot::fees;

#[test]
fun split_fee_amounts_uses_basis_points() {
    let (creator_fee, platform_fee) = fees::split_fee_amounts(1_000_000, 250, 50);

    assert!(creator_fee == 25_000, 0);
    assert!(platform_fee == 5_000, 1);
}

#[test, expected_failure(abort_code = 2, location = rangepilot::fees)]
fun split_fee_amounts_rejects_excessive_bps() {
    let (_, _) = fees::split_fee_amounts(1_000_000, 9_000, 2_000);
    abort 999
}
