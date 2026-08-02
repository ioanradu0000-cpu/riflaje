package ro.pcforge.app

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.android.billingclient.api.*
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import ro.pcforge.app.ui.theme.PCforgeTheme

class MainActivity : ComponentActivity() {
    private var mInterstitialAd: InterstitialAd? = null
    private val adUnitId = "ca-app-pub-1521253372438311/2706278361"
    private val PREFS_NAME = "AdPrefs"
    private val LAST_AD_TIME_KEY = "last_ad_time"
    private val ADS_REMOVED_KEY = "ads_removed"
    private val ONE_HOUR_IN_MILLIS = 3600000L
    private val TWO_MINUTES_IN_MILLIS = 120000L

    private lateinit var billingClient: BillingClient
    private val productId = "ad_removal" 

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setupBillingClient()
        hideSystemUI()

        MobileAds.initialize(this) {}
        
        if (!areAdsRemoved()) {
            loadInterstitialAd()
            Handler(Looper.getMainLooper()).postDelayed({
                tryToShowAd()
            }, TWO_MINUTES_IN_MILLIS)
        }

        enableEdgeToEdge()
        setContent {
            PCforgeTheme {
                // Versiunea minimă necesară (schimbă acest număr când vrei să forțezi update-ul)
                val MIN_REQUIRED_VERSION = 1

                var showUpdateDialog by remember { mutableStateOf(false) }

                LaunchedEffect(Unit) {
                    val currentVersion = try {
                        packageManager.getPackageInfo(packageName, 0).versionCode
                    } catch (e: Exception) { 0 }

                    if (currentVersion < MIN_REQUIRED_VERSION) {
                        showUpdateDialog = true
                    }
                }

                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    WebViewScreen(
                        url = "https://buildgen.base44.app",
                        modifier = Modifier.padding(innerPadding),
                        onRemoveAdsRequested = { launchRemoveAdsFlow() }
                    )

                    if (showUpdateDialog) {
                        AlertDialog(
                            onDismissRequest = { /* Forțăm actualizarea */ },
                            title = { Text("Actualizare disponibilă") },
                            text = { Text("O versiune mai nouă a aplicației BuildGen este disponibilă. Te rugăm să o actualizezi pentru a continua.") },
                            confirmButton = {
                                Button(onClick = { openPlayStore() }) {
                                    Text("Actualizează")
                                }
                            },
                            dismissButton = null
                        )
                    }
                }
            }
        }
    }


    private fun openPlayStore() {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = Uri.parse("https://play.google.com/store/apps/details?id=$packageName")
            setPackage("com.android.vending")
        }
        try {
            startActivity(intent)
        } catch (e: Exception) {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$packageName")))
        }
    }

    private fun setupBillingClient() {
        billingClient = BillingClient.newBuilder(this)
            .setListener { billingResult, purchases ->
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
                    for (purchase in purchases) {
                        handlePurchase(purchase)
                    }
                }
            }
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .build()

        connectToBilling()
    }

    private fun connectToBilling() {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    checkPreviousPurchases()
                }
            }
            override fun onBillingServiceDisconnected() {
                connectToBilling()
            }
        })
    }

    private fun checkPreviousPurchases() {
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()

        billingClient.queryPurchasesAsync(params) { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                val isSubscribed = purchases.any { 
                    it.products.contains(productId) && it.purchaseState == Purchase.PurchaseState.PURCHASED 
                }
                runOnUiThread { setAdsRemoved(isSubscribed) }
            }
        }
    }

    private fun handlePurchase(purchase: Purchase) {
        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
            if (!purchase.isAcknowledged) {
                val acknowledgePurchaseParams = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.purchaseToken)
                    .build()
                billingClient.acknowledgePurchase(acknowledgePurchaseParams) { billingResult ->
                    if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                        runOnUiThread {
                            setAdsRemoved(true)
                            Toast.makeText(this, "Abonament activat!", Toast.LENGTH_LONG).show()
                        }
                    }
                }
            } else {
                setAdsRemoved(true)
            }
        }
    }

    private fun launchRemoveAdsFlow() {
        if (!billingClient.isReady) {
            connectToBilling()
            return
        }

        val productList = listOf(
            QueryProductDetailsParams.Product.newBuilder()
                .setProductId(productId)
                .setProductType(BillingClient.ProductType.SUBS)
                .build()
        )
        val params = QueryProductDetailsParams.newBuilder().setProductList(productList).build()

        billingClient.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && productDetailsList.isNotEmpty()) {
                val productDetails = productDetailsList[0]
                val offerToken = productDetails.subscriptionOfferDetails?.get(0)?.offerToken ?: ""
                
                val productDetailsParamsList = listOf(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(productDetails)
                        .setOfferToken(offerToken)
                        .build()
                )

                val flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(productDetailsParamsList)
                    .build()
                
                runOnUiThread {
                    billingClient.launchBillingFlow(this, flowParams)
                }
            } else {
                runOnUiThread {
                    Toast.makeText(this, "Eroare: Abonamentul nu a fost găsit în Google Play.", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun areAdsRemoved(): Boolean = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getBoolean(ADS_REMOVED_KEY, false)

    private fun setAdsRemoved(removed: Boolean) {
        getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().putBoolean(ADS_REMOVED_KEY, removed).apply()
    }

    private fun hideSystemUI() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).let { controller ->
            controller.hide(WindowInsetsCompat.Type.systemBars())
            controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
    }

    private fun loadInterstitialAd() {
        if (areAdsRemoved()) return
        val adRequest = AdRequest.Builder().build()
        InterstitialAd.load(this, adUnitId, adRequest, object : InterstitialAdLoadCallback() {
            override fun onAdFailedToLoad(adError: LoadAdError) { mInterstitialAd = null }
            override fun onAdLoaded(interstitialAd: InterstitialAd) { mInterstitialAd = interstitialAd }
        })
    }

    private fun tryToShowAd() {
        if (areAdsRemoved()) return
        val sharedPrefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val lastAdTime = sharedPrefs.getLong(LAST_AD_TIME_KEY, 0L)
        val currentTime = System.currentTimeMillis()

        if (currentTime - lastAdTime >= ONE_HOUR_IN_MILLIS) {
            if (mInterstitialAd != null) {
                mInterstitialAd?.fullScreenContentCallback = object : FullScreenContentCallback() {
                    override fun onAdDismissedFullScreenContent() {
                        sharedPrefs.edit().putLong(LAST_AD_TIME_KEY, System.currentTimeMillis()).apply()
                        loadInterstitialAd()
                    }
                }
                mInterstitialAd?.show(this)
            } else { loadInterstitialAd() }
        }
    }
}

@Composable
fun WebViewScreen(url: String, modifier: Modifier = Modifier, onRemoveAdsRequested: () -> Unit) {
    var webView: WebView? by remember { mutableStateOf(null) }
    BackHandler(enabled = webView?.canGoBack() == true) { webView?.goBack() }
    
    AndroidView(
        modifier = modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                layoutParams = ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
                
                visibility = View.VISIBLE
                setBackgroundColor(0x00000000) 
                
                val hideScript = """
                    (function() {
                        var css = `
                            .base44-badge, #base44-badge, [class*="base44"], [id*="base44"], a[href*="base44"] { 
                                display: none !important; 
                                visibility: hidden !important; 
                                opacity: 0 !important; 
                            }
                        `;
                        var style = document.getElementById('base44-hide-style');
                        if (!style) {
                            style = document.createElement('style');
                            style.id = 'base44-hide-style';
                            style.type = 'text/css';
                            style.appendChild(document.createTextNode(css));
                            (document.head || document.documentElement).appendChild(style);
                        }
                        
                        function cleanBase44() {
                            var badges = document.querySelectorAll('.base44-badge, #base44-badge, [class*="base44-"], [id*="base44-"]');
                            badges.forEach(function(b) { b.remove(); });
                        }

                        if (!window.base44Observer) {
                            window.base44Observer = new MutationObserver(function(mutations) { cleanBase44(); });
                            window.base44Observer.observe(document.documentElement, { childList: true, subtree: true });
                        }
                        cleanBase44();
                    })();
                """.trimIndent()

                webChromeClient = WebChromeClient()

                webViewClient = object : WebViewClient() {
                    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                        val requestUrl = request?.url?.toString() ?: ""
                        if (requestUrl.startsWith("pcforge://")) { 
                            onRemoveAdsRequested()
                            return true 
                        }
                        return false
                    }
                    override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                        if (url != null && url.startsWith("pcforge://")) { 
                            onRemoveAdsRequested() 
                            return true 
                        }
                        return false
                    }
                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        view?.evaluateJavascript(hideScript, null)
                    }
                }
                
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    loadWithOverviewMode = true
                    useWideViewPort = true
                    setSupportZoom(true)
                }
                
                loadUrl(url)
                webView = this
            }
        },
        update = { webView = it }
    )
}
