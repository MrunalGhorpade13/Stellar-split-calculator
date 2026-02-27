#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Vec, Map,
};

// ── Data types ────────────────────────────────────────────────
#[contracttype]
#[derive(Clone)]
pub struct Bill {
    pub id: u64,
    pub description: String,
    pub total_stroops: i128,
    pub participants: Vec<Address>,
    pub paid: Map<Address, bool>,
    pub creator: Address,
}

// ── Storage keys ──────────────────────────────────────────────
const BILL_COUNT: soroban_sdk::Symbol = symbol_short!("COUNT");

fn bill_key(id: u64) -> soroban_sdk::Symbol {
    // Encode id as a simple ledger key — use storage with u64 directly
    soroban_sdk::symbol_short!("BILL")
}

// ── Contract ──────────────────────────────────────────────────
#[contract]
pub struct SplitContract;

#[contractimpl]
impl SplitContract {
    /// Create a new bill. Returns the new bill ID.
    pub fn create_bill(
        env: Env,
        description: String,
        total_stroops: i128,
        participants: Vec<Address>,
    ) -> u64 {
        // Caller must authorise
        let creator = env.current_contract_address();

        // Increment bill counter
        let count: u64 = env.storage().instance().get(&BILL_COUNT).unwrap_or(0);
        let new_id = count + 1;

        let bill = Bill {
            id: new_id,
            description,
            total_stroops,
            participants: participants.clone(),
            paid: Map::new(&env),
            creator,
        };

        env.storage().persistent().set(&new_id, &bill);
        env.storage().instance().set(&BILL_COUNT, &new_id);

        // Emit event
        env.events().publish(
            (symbol_short!("CREATED"), new_id),
            total_stroops,
        );

        new_id
    }

    /// Mark a participant as paid for a given bill.
    pub fn mark_paid(env: Env, bill_id: u64, participant: Address) {
        participant.require_auth();

        let mut bill: Bill = env
            .storage()
            .persistent()
            .get(&bill_id)
            .expect("Bill not found");

        bill.paid.set(participant.clone(), true);
        env.storage().persistent().set(&bill_id, &bill);

        // Emit event
        env.events().publish(
            (symbol_short!("PAID"), bill_id),
            participant,
        );
    }

    /// Get a bill by ID.
    pub fn get_bill(env: Env, bill_id: u64) -> Bill {
        env.storage()
            .persistent()
            .get(&bill_id)
            .expect("Bill not found")
    }

    /// Get total bill count.
    pub fn get_count(env: Env) -> u64 {
        env.storage().instance().get(&BILL_COUNT).unwrap_or(0)
    }
}

// ── Tests ─────────────────────────────────────────────────────
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_create_and_mark_paid() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, SplitContract);
        let client = SplitContractClient::new(&env, &contract_id);

        let alice = Address::generate(&env);
        let bob = Address::generate(&env);

        let bill_id = client.create_bill(
            &String::from_str(&env, "Dinner"),
            &1_000_000i128,
            &Vec::from_array(&env, [alice.clone(), bob.clone()]),
        );

        assert_eq!(bill_id, 1);

        client.mark_paid(&bill_id, &alice);

        let bill = client.get_bill(&bill_id);
        assert_eq!(bill.paid.get(alice).unwrap(), true);
    }
}
