module deepvol::series;

use deepvol::{errors, fees};
use sui::{clock::Clock, event};

public struct VolSeries has key {
    id: UID,
    creator: address,
    oracle_id: ID,
    expiry: u64,
    lower_strike: u64,
    upper_strike: u64,
    metadata_uri: vector<u8>,
    create_fee_bps: u64,
    active: bool,
    created_at_ms: u64,
}

public struct VolSeriesCreated has copy, drop {
    series_id: ID,
    creator: address,
    oracle_id: ID,
    expiry: u64,
    lower_strike: u64,
    upper_strike: u64,
    metadata_uri: vector<u8>,
    create_fee_bps: u64,
    created_at_ms: u64,
}

public struct VolSeriesDeactivated has copy, drop {
    series_id: ID,
    creator: address,
    timestamp_ms: u64,
}

public entry fun create_series(
    oracle_id: ID,
    expiry: u64,
    lower_strike: u64,
    upper_strike: u64,
    create_fee_bps: u64,
    metadata_uri: vector<u8>,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let series = new_series(
        ctx.sender(),
        oracle_id,
        expiry,
        lower_strike,
        upper_strike,
        create_fee_bps,
        metadata_uri,
        clock.timestamp_ms(),
        ctx,
    );
    let series_id = object::id(&series);

    event::emit(VolSeriesCreated {
        series_id,
        creator: series.creator,
        oracle_id: series.oracle_id,
        expiry: series.expiry,
        lower_strike: series.lower_strike,
        upper_strike: series.upper_strike,
        metadata_uri: series.metadata_uri,
        create_fee_bps: series.create_fee_bps,
        created_at_ms: series.created_at_ms,
    });

    transfer::share_object(series);
}

public entry fun deactivate_series(
    series: &mut VolSeries,
    clock: &Clock,
    ctx: &TxContext,
) {
    deactivate(series, ctx.sender(), clock.timestamp_ms());
}

public fun id(series: &VolSeries): ID {
    object::id(series)
}

public fun creator(series: &VolSeries): address {
    series.creator
}

public fun oracle_id(series: &VolSeries): ID {
    series.oracle_id
}

public fun expiry(series: &VolSeries): u64 {
    series.expiry
}

public fun lower_strike(series: &VolSeries): u64 {
    series.lower_strike
}

public fun upper_strike(series: &VolSeries): u64 {
    series.upper_strike
}

public fun create_fee_bps(series: &VolSeries): u64 {
    series.create_fee_bps
}

public fun is_active(series: &VolSeries): bool {
    series.active
}

fun new_series(
    creator: address,
    oracle_id: ID,
    expiry: u64,
    lower_strike: u64,
    upper_strike: u64,
    create_fee_bps: u64,
    metadata_uri: vector<u8>,
    created_at_ms: u64,
    ctx: &mut TxContext,
): VolSeries {
    assert!(!metadata_uri.is_empty(), errors::empty_metadata_uri());
    assert!(lower_strike < upper_strike, errors::invalid_strike_range());
    assert!(expiry > created_at_ms, errors::expired_series());
    fees::assert_valid_create_fee_bps(create_fee_bps);

    VolSeries {
        id: object::new(ctx),
        creator,
        oracle_id,
        expiry,
        lower_strike,
        upper_strike,
        metadata_uri,
        create_fee_bps,
        active: true,
        created_at_ms,
    }
}

fun deactivate(series: &mut VolSeries, sender: address, timestamp_ms: u64) {
    assert!(sender == series.creator, errors::unauthorized());

    series.active = false;

    event::emit(VolSeriesDeactivated {
        series_id: object::id(series),
        creator: series.creator,
        timestamp_ms,
    });
}

#[test_only]
public fun new_series_for_testing(
    creator: address,
    oracle_id: ID,
    expiry: u64,
    lower_strike: u64,
    upper_strike: u64,
    create_fee_bps: u64,
    metadata_uri: vector<u8>,
    created_at_ms: u64,
    ctx: &mut TxContext,
): VolSeries {
    new_series(
        creator,
        oracle_id,
        expiry,
        lower_strike,
        upper_strike,
        create_fee_bps,
        metadata_uri,
        created_at_ms,
        ctx,
    )
}

#[test_only]
public fun deactivate_for_testing(series: &mut VolSeries, sender: address, timestamp_ms: u64) {
    deactivate(series, sender, timestamp_ms);
}

#[test_only]
public fun destroy_for_testing(series: VolSeries) {
    let VolSeries { id, metadata_uri: _, .. } = series;
    id.delete();
}

#[test_only]
public fun created_at_ms_for_testing(series: &VolSeries): u64 {
    series.created_at_ms
}
