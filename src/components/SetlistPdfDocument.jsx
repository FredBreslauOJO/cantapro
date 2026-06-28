import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff'
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  eventName: {
    fontSize: 28,
    fontWeight: 'extrabold',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  bandDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  songItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  songIndex: {
    fontSize: 16,
    color: '#999999',
    width: 28,
    fontFamily: 'Helvetica-Bold',
  },
  songTitle: {
    fontSize: 16,
    color: '#000000',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  dividerItem: {
    width: '47%',
    marginBottom: 16,
    paddingBottom: 4,
    justifyContent: 'center',
  },
  dividerText: {
    fontSize: 12,
    color: '#000000',
    backgroundColor: '#eeeeee',
    padding: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  }
});

const truncate = (str, max) => {
  if (!str) return "";
  return str.length > max ? str.substring(0, max - 2) + ".." : str;
};

export const SetlistPdfDocument = ({ eventName, bandName, date, orderedItems }) => {
  let songCounter = 1;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={styles.header}>
          <Text style={styles.eventName}>{eventName || "MEU SETLIST"}</Text>
          <View style={styles.bandDateRow}>
            <Text style={styles.subtitle}>{bandName || "Banda / Artista"}</Text>
            <Text style={styles.subtitle}>
              {date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR') : ""}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {orderedItems.map((item, idx) => {
            
            if (item.item_type === 'divider') {
              return (
                <View key={item.id || idx} style={styles.dividerItem}>
                  <Text style={styles.dividerText}>{truncate(item.content || "---", 25)}</Text>
                </View>
              );
            }

            // CORREÇÃO AQUI: Usa a música que veio junto do Join no banco de dados
            const song = item.songs;
            const currentIndex = songCounter++;
            const title = song ? song.title : "Música Deletada";

            return (
              <View key={item.id || idx} style={styles.songItem}>
                <Text style={styles.songIndex}>{currentIndex.toString().padStart(2, '0')}</Text>
                <Text style={styles.songTitle}>{truncate(title, 22)}</Text>
              </View>
            );
          })}
        </View>

      </Page>
    </Document>
  );
};