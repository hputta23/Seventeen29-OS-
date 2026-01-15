use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use anyhow::{Result, anyhow};

#[derive(Debug, Clone, Copy, PartialEq)]
enum State {
    Closed,
    Open,
    HalfOpen,
}

pub struct CircuitBreaker {
    state: Arc<Mutex<State>>,
    failure_count: Arc<Mutex<u32>>,
    last_failure: Arc<Mutex<Option<Instant>>>,
    threshold: u32,
    reset_timeout: Duration,
}

impl CircuitBreaker {
    pub fn new(threshold: u32, reset_timeout_secs: u64) -> Self {
        Self {
            state: Arc::new(Mutex::new(State::Closed)),
            failure_count: Arc::new(Mutex::new(0)),
            last_failure: Arc::new(Mutex::new(None)),
            threshold,
            reset_timeout: Duration::from_secs(reset_timeout_secs),
        }
    }

    pub fn check(&self) -> Result<()> {
        let mut state = self.state.lock().unwrap();
        let mut failures = self.failure_count.lock().unwrap();
        let last_fail = self.last_failure.lock().unwrap();

        match *state {
            State::Open => {
                if let Some(last) = *last_fail {
                    if last.elapsed() > self.reset_timeout {
                        *state = State::HalfOpen;
                        *failures = 0; // Reset for trial
                        return Ok(()); // Allow trial request
                    }
                }
                Err(anyhow!("Circuit Breaker OPEN: Service unavailable"))
            }
            State::HalfOpen => Ok(()), // Allow single trial
            State::Closed => Ok(()),
        }
    }

    pub fn record_success(&self) {
        let mut state = self.state.lock().unwrap();
        let mut failures = self.failure_count.lock().unwrap();
        *state = State::Closed;
        *failures = 0;
    }

    pub fn record_failure(&self) {
        let mut state = self.state.lock().unwrap();
        let mut failures = self.failure_count.lock().unwrap();
        let mut last_fail = self.last_failure.lock().unwrap();

        *failures += 1;
        *last_fail = Some(Instant::now());

        if *failures >= self.threshold {
            *state = State::Open;
        }
    }
}
