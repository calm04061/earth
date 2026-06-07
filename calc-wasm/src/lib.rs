use wasm_bindgen::prelude::*;
use sha1::Sha1;
use sha2::{Digest, Sha256, Sha384, Sha512};

#[wasm_bindgen]
pub fn eval_expression(expr: &str) -> String {
    let chars: Vec<char> = expr.chars().collect();
    let mut pos = 0;
    match parse_expr(&chars, &mut pos) {
        Ok(val) => {
            if val.is_infinite() || val.is_nan() {
                "Error".to_string()
            } else {
                let s = format!("{:.10}", val);
                let s = s.trim_end_matches('0').trim_end_matches('.');
                s.to_string()
            }
        }
        Err(_) => format!("Error"),
    }
}

fn parse_expr(chars: &[char], pos: &mut usize) -> Result<f64, ()> {
    let mut left = parse_term(chars, pos)?;
    loop {
        skip_ws(chars, pos);
        if *pos >= chars.len() { break; }
        match chars[*pos] {
            '+' => { *pos += 1; let right = parse_term(chars, pos)?; left += right; }
            '-' => { *pos += 1; let right = parse_term(chars, pos)?; left -= right; }
            _ => break,
        }
    }
    Ok(left)
}

fn parse_term(chars: &[char], pos: &mut usize) -> Result<f64, ()> {
    let mut left = parse_factor(chars, pos)?;
    loop {
        skip_ws(chars, pos);
        if *pos >= chars.len() { break; }
        match chars[*pos] {
            '*' => { *pos += 1; let right = parse_factor(chars, pos)?; left *= right; }
            '/' => {
                *pos += 1;
                let right = parse_factor(chars, pos)?;
                if right == 0.0 { return Err(()); }
                left /= right;
            }
            _ => break,
        }
    }
    Ok(left)
}

fn parse_factor(chars: &[char], pos: &mut usize) -> Result<f64, ()> {
    skip_ws(chars, pos);
    if *pos >= chars.len() { return Err(()); }

    // Unary minus
    if chars[*pos] == '-' {
        *pos += 1;
        let val = parse_factor(chars, pos)?;
        return Ok(-val);
    }
    // Unary plus
    if chars[*pos] == '+' {
        *pos += 1;
        return parse_factor(chars, pos);
    }

    // Parentheses
    if chars[*pos] == '(' {
        *pos += 1;
        let val = parse_expr(chars, pos)?;
        skip_ws(chars, pos);
        if *pos >= chars.len() || chars[*pos] != ')' { return Err(()); }
        *pos += 1;
        return Ok(val);
    }

    // Number
    parse_number(chars, pos)
}

fn parse_number(chars: &[char], pos: &mut usize) -> Result<f64, ()> {
    skip_ws(chars, pos);
    let start = *pos;
    let mut has_dot = false;
    while *pos < chars.len() {
        match chars[*pos] {
            '0'..='9' => { *pos += 1; }
            '.' if !has_dot => { has_dot = true; *pos += 1; }
            _ => break,
        }
    }
    if *pos == start { return Err(()); }
    let s: String = chars[start..*pos].iter().collect();
    s.parse::<f64>().map_err(|_| ())
}

fn skip_ws(chars: &[char], pos: &mut usize) {
    while *pos < chars.len() && chars[*pos].is_whitespace() {
        *pos += 1;
    }
}

fn hash_to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

#[wasm_bindgen]
pub fn sha1_hash(data: &[u8]) -> String {
    let mut hasher = Sha1::new();
    hasher.update(data);
    hash_to_hex(&hasher.finalize())
}

#[wasm_bindgen]
pub fn sha256_hash(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hash_to_hex(&hasher.finalize())
}

#[wasm_bindgen]
pub fn sha384_hash(data: &[u8]) -> String {
    let mut hasher = Sha384::new();
    hasher.update(data);
    hash_to_hex(&hasher.finalize())
}

#[wasm_bindgen]
pub fn sha512_hash(data: &[u8]) -> String {
    let mut hasher = Sha512::new();
    hasher.update(data);
    hash_to_hex(&hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic() {
        assert_eq!(eval_expression("1+2"), "3");
    }

    #[test]
    fn test_precedence() {
        assert_eq!(eval_expression("2+3*4"), "14");
    }

    #[test]
    fn test_parens() {
        assert_eq!(eval_expression("(2+3)*4"), "20");
    }

    #[test]
    fn test_decimal() {
        assert_eq!(eval_expression("3.5+1.5"), "5");
    }

    #[test]
    fn test_unary_minus() {
        assert_eq!(eval_expression("-5+3"), "-2");
    }

    #[test]
    fn test_div_by_zero() {
        assert_eq!(eval_expression("1/0"), "Error");
    }
}
