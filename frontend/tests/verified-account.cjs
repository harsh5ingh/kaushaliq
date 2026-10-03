// Earlier suites exercise established product behavior after genuine backend verification.
// Mail capture is a test-only backend dependency, never a production environment provider.
async function installVerifiedAccount(page, stack) {
  await page.route('**/api/auth/register', async route => {
    const response=await route.fetch();const body=await response.json();
    if(!response.ok() || !body.verification_required || body.state!=='CONFIGURED')return route.fulfill({response});
    const email=route.request().postDataJSON().email;
    const capture=await page.request.get(`http://127.0.0.1:${stack.apiPort}/__test/otp?target=${encodeURIComponent(email)}`);
    const {code}=await capture.json();
    const confirmed=await page.request.post(stack.base+'/api/auth/verification/confirm',{headers:{Origin:stack.base,'X-CSRF-Token':body.csrfToken},data:{code}});
    if(!confirmed.ok())throw new Error('Test account verification failed');
    await route.fulfill({response,body:JSON.stringify(await confirmed.json())});
  });
}
module.exports={installVerifiedAccount};
