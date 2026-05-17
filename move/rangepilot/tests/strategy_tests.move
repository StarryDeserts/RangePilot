#[test_only]
module rangepilot::strategy_tests;

use rangepilot::{fees, strategy};
use std::unit_test::assert_eq;

const CREATOR: address = @0xA;
const FOLLOWER: address = @0xB;
const PLATFORM: address = @0xC;
const ORACLE: address = @0xD;
const EXPIRY: u64 = 1_778_918_400_000;
const LOWER_STRIKE: u64 = 77_871_000_000_000;
const HIGHER_STRIKE: u64 = 78_371_000_000_000;
const DEFAULT_QUANTITY: u64 = 1_000;
const CREATOR_FEE_BPS: u64 = 250;
const PLATFORM_FEE_BPS: u64 = 50;
const CREATED_AT_MS: u64 = 1_000;
const DEACTIVATED_AT_MS: u64 = 2_000;

#[test]
fun split_fee_amounts_uses_basis_points() {
    let (creator_fee, platform_fee) = fees::split_fee_amounts(1_000_000, 250, 50);

    assert_eq!(creator_fee, 25_000);
    assert_eq!(platform_fee, 5_000);
}

#[test]
fun nonzero_fee_amount_accepts_positive_fee() {
    fees::assert_nonzero_fee_amount(1);

    assert!(true);
}

#[test]
fun new_strategy_stores_expected_fields() {
    let mut ctx = tx_context::dummy();
    let strategy = strategy::new_strategy_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        HIGHER_STRIKE,
        DEFAULT_QUANTITY,
        CREATOR_FEE_BPS,
        PLATFORM_FEE_BPS,
        PLATFORM,
        b"ipfs://strategy",
        CREATED_AT_MS,
        &mut ctx,
    );

    assert_eq!(strategy::creator_for_testing(&strategy), CREATOR);
    assert_eq!(strategy::default_quantity_for_testing(&strategy), DEFAULT_QUANTITY);
    assert!(strategy::active_for_testing(&strategy));

    strategy::destroy_for_testing(strategy);
}

#[test]
fun deactivate_strategy_sets_inactive_for_creator() {
    let mut ctx = tx_context::dummy();
    let mut strategy = strategy::new_strategy_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        HIGHER_STRIKE,
        DEFAULT_QUANTITY,
        CREATOR_FEE_BPS,
        PLATFORM_FEE_BPS,
        PLATFORM,
        b"ipfs://strategy",
        CREATED_AT_MS,
        &mut ctx,
    );

    strategy::deactivate_for_testing(&mut strategy, CREATOR, DEACTIVATED_AT_MS);

    assert!(!strategy::active_for_testing(&strategy));

    strategy::destroy_for_testing(strategy);
}

#[test, expected_failure(abort_code = 2, location = rangepilot::fees)]
fun split_fee_amounts_rejects_excessive_total_bps() {
    let (_, _) = fees::split_fee_amounts(1_000_000, 9_000, 2_000);
    abort 999
}

#[test, expected_failure(abort_code = 2, location = rangepilot::fees)]
fun split_fee_amounts_rejects_excessive_creator_bps() {
    let (_, _) = fees::split_fee_amounts(1_000_000, 10_001, 0);
    abort 999
}

#[test, expected_failure(abort_code = 2, location = rangepilot::fees)]
fun split_fee_amounts_rejects_excessive_platform_bps() {
    let (_, _) = fees::split_fee_amounts(1_000_000, 0, 10_001);
    abort 999
}

#[test, expected_failure(abort_code = 5, location = rangepilot::fees)]
fun nonzero_fee_amount_rejects_zero_fee() {
    fees::assert_nonzero_fee_amount(0);
    abort 999
}

#[test, expected_failure(abort_code = 1, location = rangepilot::strategy)]
fun new_strategy_rejects_zero_default_quantity() {
    let mut ctx = tx_context::dummy();
    let strategy = strategy::new_strategy_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        HIGHER_STRIKE,
        0,
        CREATOR_FEE_BPS,
        PLATFORM_FEE_BPS,
        PLATFORM,
        b"ipfs://strategy",
        CREATED_AT_MS,
        &mut ctx,
    );
    strategy::destroy_for_testing(strategy);
    abort 999
}

#[test, expected_failure(abort_code = 6, location = rangepilot::strategy)]
fun new_strategy_rejects_empty_metadata_uri() {
    let mut ctx = tx_context::dummy();
    let strategy = strategy::new_strategy_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        HIGHER_STRIKE,
        DEFAULT_QUANTITY,
        CREATOR_FEE_BPS,
        PLATFORM_FEE_BPS,
        PLATFORM,
        vector[],
        CREATED_AT_MS,
        &mut ctx,
    );
    strategy::destroy_for_testing(strategy);
    abort 999
}

#[test, expected_failure(abort_code = 4, location = rangepilot::strategy)]
fun deactivate_strategy_rejects_non_creator() {
    let mut ctx = tx_context::dummy();
    let mut strategy = strategy::new_strategy_for_testing(
        CREATOR,
        object::id_from_address(ORACLE),
        EXPIRY,
        LOWER_STRIKE,
        HIGHER_STRIKE,
        DEFAULT_QUANTITY,
        CREATOR_FEE_BPS,
        PLATFORM_FEE_BPS,
        PLATFORM,
        b"ipfs://strategy",
        CREATED_AT_MS,
        &mut ctx,
    );

    strategy::deactivate_for_testing(&mut strategy, FOLLOWER, DEACTIVATED_AT_MS);

    strategy::destroy_for_testing(strategy);
    abort 999
}
