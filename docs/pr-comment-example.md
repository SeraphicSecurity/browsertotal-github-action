# Example PR Comment

This is what a PR comment from the BrowserTotal GitHub Action looks like:

---

<!-- BrowserTotal-scan-results -->
<div align="center">
  <img src="https://raw.githubusercontent.com/SeraphicSecurity/browsertotal-github-action/main/assets/256.png" alt="BrowserTotal" width="128" height="128">
  
  # 🛡️ Browser Security Posture Scan Results
  
  🟡 **Security Grade: B**
</div>

## Browser Security Posture Scan Summary

**Grade:** B
**Score:** 85 / 100
**Pass Rate:** 92.3% (120/130 tests)

### Failed Tests (10)

- **WebRTC API**: WebRTC APIs are exposed
- **Battery API**: Battery status API is accessible
- **Geolocation API**: Geolocation access not properly restricted
- **Canvas Fingerprinting**: Canvas can be used for fingerprinting
- **WebGL Fingerprinting**: WebGL parameters expose system information

### Top Security Features (Sample)

- ✅ Spectre Mitigations
- ✅ Cross-Origin Isolation
- ✅ Secure Contexts Only
- ✅ CSP Support
- ✅ SameSite Cookie Enforcement

---
<details>
<summary>📊 View Full Results</summary>

```json
{
  "score": {
    "current": 85,
    "max": 100,
    "grade": "B"
  },
  "passedCount": 120,
  "failedCount": 10,
  "totalTests": 130,
  "results": {
    "WebRTC API": {
      "passed": false,
      "details": {
        "message": "WebRTC APIs are exposed"
      }
    },
    "Battery API": {
      "passed": false,
      "details": {
        "message": "Battery status API is accessible"
      }
    },
    // ... more results
  }
}
```

</details>

---
<div align="center">
  <sub>🤖 Powered by <a href="https://browsertotal.com">BrowserTotal</a> • This comment is automatically updated on each commit</sub>
</div> 