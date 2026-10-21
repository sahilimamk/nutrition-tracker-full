package com.sahil.nutritiontracker;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Single-activity WebView wrapper for the Nutrition Tracker PWA. */
public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Swap the splash theme for the normal theme once we're past launch.
        setTheme(android.R.style.Theme_Material_Light_NoActionBar);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                && checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.CAMERA}, 1);
        }

        web = new WebView(this);
        web.setBackgroundColor(0xFFF4F6F4); // match app background, no white flash
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);           // localStorage for the diary
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);

        web.setWebViewClient(new WebViewClient()); // keep navigation in-app

        web.setWebChromeClient(new CamChromeClient(this));

        setContentView(web);
        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl("file:///android_asset/www/index.html");
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (web != null) web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }

    /** Grants WebView camera requests once the CAMERA permission is held. */
    private static class CamChromeClient extends WebChromeClient {
        private final Activity activity;
        CamChromeClient(Activity activity) { this.activity = activity; }

        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            activity.runOnUiThread(new GrantTask(activity, request));
        }
    }

    /** Grants or denies a WebView permission request on the UI thread. */
    private static class GrantTask implements Runnable {
        private final Activity activity;
        private final PermissionRequest request;
        GrantTask(Activity activity, PermissionRequest request) {
            this.activity = activity;
            this.request = request;
        }
        @Override
        public void run() {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M
                    || activity.checkSelfPermission(Manifest.permission.CAMERA)
                    == PackageManager.PERMISSION_GRANTED) {
                request.grant(request.getResources());
            } else {
                request.deny();
            }
        }
    }
}
