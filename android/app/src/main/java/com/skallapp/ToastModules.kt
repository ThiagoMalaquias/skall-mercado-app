package com.skallapp

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager

import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.util.Log
import android.widget.Toast

import androidx.annotation.RequiresApi;
import com.elgin.e1.Impressora.Termica

import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule

import java.io.File;
import java.io.FileInputStream;

import org.json.JSONException

class ToastModules(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private var mPromise: Promise? = null
  private val REQUEST_CODE = 1234

  init {
      reactContext.addActivityEventListener(this)
  }

  override fun getName(): String {
      return "ToastModules"
  }

  override fun onNewIntent(intent: Intent?) {
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode == 4321 || requestCode == 4322) {
        if ((resultCode == Activity.RESULT_OK || resultCode == Activity.RESULT_CANCELED) && data != null) {
            try {
                val result: WritableMap = Arguments.createMap()
                val jsonString = convertResultFromJSON(data)
                Log.d("onActivityResult_TEF", "oxe $jsonString")
                result.putString("restultMsitef", jsonString)
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("eventResultSitef", result)
            } catch (e: JSONException) {
                e.printStackTrace()
            }
        } else {
            Toast.makeText(reactContext.applicationContext, "Transação cancelada!", Toast.LENGTH_LONG).show()
        }
    }
  }

  fun convertResultFromJSON(receiveResult: Intent): String {
    val convertJSON = org.json.JSONObject()

    convertJSON.put("COD_AUTORIZACAO", receiveResult.getStringExtra("COD_AUTORIZACAO"))
    convertJSON.put("VIA_ESTABELECIMENTO", receiveResult.getStringExtra("VIA_ESTABELECIMENTO"))
    convertJSON.put("COMP_DADOS_CONF", receiveResult.getStringExtra("COMP_DADOS_CONF"))
    convertJSON.put("BANDEIRA", receiveResult.getStringExtra("BANDEIRA"))
    convertJSON.put("RELATORIO_TRANS", receiveResult.getStringExtra("RELATORIO_TRANS"))
    convertJSON.put("NUM_PARC", receiveResult.getStringExtra("NUM_PARC"))
    convertJSON.put("REDE_AUT", receiveResult.getStringExtra("REDE_AUT"))
    convertJSON.put("NSU_SITEF", receiveResult.getStringExtra("NSU_SITEF"))
    convertJSON.put("VIA_CLIENTE", receiveResult.getStringExtra("VIA_CLIENTE"))
    convertJSON.put("TIPO_PARC", receiveResult.getStringExtra("TIPO_PARC"))
    convertJSON.put("CODRESP", receiveResult.getStringExtra("CODRESP"))
    convertJSON.put("CODTRANS", receiveResult.getStringExtra("CODTRANS"))
    convertJSON.put("NSU_HOST", receiveResult.getStringExtra("NSU_HOST"))
    convertJSON.put("VLTROCO", receiveResult.getStringExtra("VLTROCO"))

    return convertJSON.toString()
  }

  @ReactMethod
  fun runMsiTef(configsReceived: ReadableMap) {
      val intentToMsitef = Intent("br.com.softwareexpress.sitef.msitef.ACTIVITY_CLISITEF")
      val thisActivity = currentActivity

      val instanceBundle = Bundle()

      val iterator = configsReceived.keySetIterator()
      while (iterator.hasNextKey()) {
          val key = iterator.nextKey()
          instanceBundle.putString(key, configsReceived.getString(key))
      }

      intentToMsitef.putExtras(instanceBundle)

      thisActivity?.startActivityForResult(intentToMsitef, 4321)
  }

  @RequiresApi(Build.VERSION_CODES.N)
  @ReactMethod
  fun sendOptionsClassPrinter(configsReceived: ReadableMap, promise: Promise) {
		try {
			val result: WritableMap = Arguments.createMap()
			val typePrinter = configsReceived.getString("typePrinter")

			result.putString("status", "called")
			result.putString("typePrinter", typePrinter)

			promise.resolve(result)
		} catch (e: Exception) {
			promise.reject("ERROR", "Erro ao processar", e)
		}
  }

	@RequiresApi(Build.VERSION_CODES.N)
	@ReactMethod
	fun abreConexaoImpressora(configsReceived: ReadableMap, promise: Promise) {
        try {
                val thisActivity = currentActivity

                if (thisActivity == null) {
                        promise.reject("NO_ACTIVITY", "Activity está nula.")
                        return
                }

                Termica.setActivity(thisActivity);

                Termica.AbreConexaoImpressora(5, "", "", 0)
        } catch (e: Exception) {
                Log.e("Termica", "Erro no teste de impressão", e)
                promise.reject("ERROR", "Erro ao imprimir", e)
        }
	}

    @RequiresApi(Build.VERSION_CODES.N)
	@ReactMethod
	fun imprimeTexto(map: ReadableMap, promise: Promise) {
        val text = map.getString("text") ?: ""
        val align = map.getString("align") ?: "Esquerda"
        val font = map.getString("font") ?: "FONT A"
        val fontSize = map.getInt("fontSize")
        val isBold = map.getBoolean("isBold")
        val isUnderline = map.getBoolean("isUnderline")

        val alignValue = when (align) {
            "Esquerda" -> 0
            "Centralizado" -> 1
            else -> 2
        }

        var styleValue = 0
        if (font == "FONT B") styleValue += 1
        if (isUnderline) styleValue += 2
        if (isBold) styleValue += 8

        val resultImpressao = Termica.ImpressaoTexto(text, alignValue, styleValue, fontSize)
        promise.resolve("Impressão enviada com sucesso $resultImpressao")
	}

    @RequiresApi(Build.VERSION_CODES.N)
	@ReactMethod
	fun avancaLinhas(map: ReadableMap, promise: Promise) {
        val lines = map.getInt("quant");

        Termica.AvancaPapel(lines);
        promise.resolve("AvancaLinhas enviada com sucesso $lines")
    }

    @RequiresApi(Build.VERSION_CODES.N)
	@ReactMethod
	fun cutPaper(map: ReadableMap, promise: Promise) {
        val lines = map.getInt("quant");

        Termica.Corte(lines);
        promise.resolve("cutPaper enviada com sucesso $lines")
    }
}