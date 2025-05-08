package com.skallmercadoapp

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.util.Log
import android.widget.Toast
import com.elgin.e1.Impressora.Termica
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.File

class Printer(private val activity: Activity) {

    init {
        mActivity = activity
        Termica.setContext(mActivity)
    }

    companion object {
        private lateinit var mActivity: Activity
        var isPrinterInternSelected: Boolean = false

        fun printerInternalImpStart(): Int {
            printerStop()
            val result = Termica.AbreConexaoImpressora(6, "M8", "", 0)
            if (result == 0) isPrinterInternSelected = true
            return result
        }

        fun printerExternalImpIpStart(map: ReadableMap): Int {
            printerStop()
            val model = map.getString("printerModel") ?: ""
            val ip = map.getString("ip") ?: ""
            val port = map.getInt("port")

            return try {
                val result = Termica.AbreConexaoImpressora(3, model, ip, port)
                Log.d("Printer", "result EXTERNA IP: $result")
                if (result == 0) isPrinterInternSelected = false
                result
            } catch (e: Exception) {
                Log.e("Printer", "exception: $e")
                printerInternalImpStart()
            }
        }

        fun printerExternalImpUsbStart(map: ReadableMap): Int {
            printerStop()
            val model = map.getString("printerModel") ?: ""

            return try {
                val result = Termica.AbreConexaoImpressora(1, model, "USB", 0)
                if (result == 0) isPrinterInternSelected = false
                result
            } catch (e: Exception) {
                printerInternalImpStart()
            }
        }

        fun printerStop() {
            Termica.FechaConexaoImpressora()
        }

        fun AvancaLinhas(map: ReadableMap): Int {
            val lines = map.getInt("quant")
            return Termica.AvancaPapel(lines)
        }

        fun cutPaper(map: ReadableMap): Int {
            val lines = map.getInt("quant")
            return Termica.Corte(lines)
        }

        fun imprimeTexto(map: ReadableMap): Int {
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

            return Termica.ImpressaoTexto(text, alignValue, styleValue, fontSize)
        }

        private fun codeOfBarCode(barCodeName: String): Int = when (barCodeName) {
            "UPC-A" -> 0
            "UPC-E" -> 1
            "EAN 13", "JAN 13" -> 2
            "EAN 8", "JAN 8" -> 3
            "CODE 39" -> 4
            "ITF" -> 5
            "CODE BAR" -> 6
            "CODE 93" -> 7
            "CODE 128" -> 8
            else -> 0
        }

        fun imprimeBarCode(map: ReadableMap): Int {
            val barCodeType = codeOfBarCode(map.getString("barCodeType") ?: "")
            val text = map.getString("text") ?: ""
            val height = map.getInt("height")
            val width = map.getInt("width")
            val align = map.getString("align") ?: "Esquerda"

            val alignValue = when (align) {
                "Esquerda" -> 0
                "Centralizado" -> 1
                else -> 2
            }

            Termica.DefinePosicao(alignValue)

            return Termica.ImpressaoCodigoBarras(barCodeType, text, height, width, 4)
        }

        fun imprimeQR_CODE(map: ReadableMap): Int {
            val size = map.getInt("qrSize")
            val text = map.getString("text") ?: ""
            val align = map.getString("align") ?: "Esquerda"

            val alignValue = when (align) {
                "Esquerda" -> 0
                "Centralizado" -> 1
                else -> 2
            }

            Termica.DefinePosicao(alignValue)

            return Termica.ImpressaoQRCode(text, size, 2)
        }

        fun imprimeImagem(map: ReadableMap): Int {
            Log.d("Printer", "IMPRIMINDO IMAGEM")

            val pathImage = map.getString("pathImage") ?: ""
            val isBase64 = map.getBoolean("isBase64")
            val mSaveBit = File(pathImage)

            val bitmap: Bitmap = when {
                pathImage == "elgin" -> {
                    val id = mActivity.applicationContext.resources.getIdentifier(
                        pathImage,
                        "drawable",
                        mActivity.applicationContext.packageName
                    )
                    BitmapFactory.decodeResource(mActivity.applicationContext.resources, id)
                }

                isBase64 -> {
                    val decodedString = Base64.decode(pathImage, Base64.DEFAULT)
                    BitmapFactory.decodeByteArray(decodedString, 0, decodedString.size)
                }

                else -> {
                    val filePath = mSaveBit.path
                    BitmapFactory.decodeFile(filePath)
                }
            }

            return if (isPrinterInternSelected) {
                Termica.ImprimeBitmap(bitmap)
            } else {
                Termica.ImprimeImagem(bitmap)
            }
        }

        fun imprimeXMLNFCe(map: ReadableMap): Int {
            val xmlNFCe = map.getString("xmlNFCe") ?: ""
            val indexcsc = map.getInt("indexcsc")
            val csc = map.getString("csc") ?: ""
            val param = map.getInt("param")
            return Termica.ImprimeXMLNFCe(xmlNFCe, indexcsc, csc, param)
        }

        fun imprimeXMLSAT(map: ReadableMap): Int {
            val xml = map.getString("xmlSAT") ?: ""
            val param = map.getInt("param")
            return Termica.ImprimeXMLSAT(xml, param)
        }

        fun imprimeCupomTEF(map: ReadableMap): Int {
            val base64 = map.getString("base64") ?: ""
            return Termica.ImprimeCupomTEF(base64)
        }

        fun statusGaveta(): Int {
            return Termica.StatusImpressora(1)
        }

        fun abrirGaveta(): Int {
            return Termica.AbreGavetaElgin()
        }

        fun statusSensorPapel(): Int {
            return Termica.StatusImpressora(3)
        }
    }
}
